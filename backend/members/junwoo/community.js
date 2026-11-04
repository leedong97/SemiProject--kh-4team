const express = require("express");
const db = require("../../db");

const { session, requireUser } = require('../dong/communitySession');
const { wrap, fail, id, text, anonymous, transaction, numberFor, decodeFiles, attachments, present, postResult, lockPost, errorHandler } = require('./communitySupport');

const router = express.Router();
router.use(session, requireUser);

// 게시글 목록 조회
router.get("/", async function (req, res) {
    const page = Number(req.query.page || 1);
    const postsPerPage = 10;

    // 올바른 페이지 번호인지 확인
    if (!Number.isSafeInteger(page) || page < 1) {
        return res.status(400).json({
            message: "페이지 번호를 확인해주세요."
        });
    }

    // 검색 조건
    let boardName = "전체";
    let keyword = "";

    if (typeof req.query.boardName === "string") {
        boardName = req.query.boardName;
    }

    if (typeof req.query.keyword === "string") {
        keyword = req.query.keyword.trim();
    }

    const offset = (page - 1) * postsPerPage;

    if (!Number.isSafeInteger(offset)) {
        return res.status(400).json({
            message: "페이지 번호가 너무 큽니다."
        });
    }

    // 조건에 맞춰 SQL과 전달할 값 만들기
    let whereSql = " WHERE 1 = 1";
    const values = [];

    if (boardName !== "전체") {
        whereSql += " AND p.board_name = ?";
        values.push(boardName);
    }

    if (keyword !== "") {
        whereSql += " AND (p.title LIKE ? OR p.content LIKE ?)";

        values.push("%" + keyword + "%");
        values.push("%" + keyword + "%");
    }

    try {
        // 검색 조건에 맞는 전체 글 개수
        const countSql = `
            SELECT COUNT(*) AS total
            FROM community_post p
        ` + whereSql;

        const [countRows] = await db.query(countSql, values);

        const total = Number(countRows[0].total);
        const totalPages = Math.ceil(total / postsPerPage);

        // 현재 페이지의 글 10개 조회
        const listSql = `
            SELECT
                p.id,
                p.board_name AS boardName,
                p.title,
                p.content,
                p.author_id AS authorId,
                p.is_anonymous AS isAnonymous,
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                p.created_at AS createdAt,
                p.updated_at AS updatedAt,
                p.is_resolved AS isResolved,
                (
            SELECT COUNT(*)
            FROM community_comment c
            WHERE c.post_id = p.id
            AND c.is_deleted = 0
                ) AS commentCount
            FROM community_post p
            LEFT JOIN employees e
                ON p.author_id = e.employee_id
        ` + whereSql + `
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT ? OFFSET ?
        `;

        // 개수 조회용 배열은 유지하고 새 배열에 추가
        const listValues = values.slice();

        listValues.push(postsPerPage);
        listValues.push(offset);

        const [posts] = await db.query(listSql, listValues);

        res.json({
            posts: await present(db, posts, req.communityUser.id, 'post'),
            total: total,
            page: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error("커뮤니티 목록 조회 오류:", error);

        res.status(500).json({
            message: "게시글을 불러오지 못했습니다."
        });
    }
});

router.post('/', wrap(async (req, res) => {
    const title = text(req.body.title, 200), content = text(req.body.content, 10000), board = req.body.boardName;
    if (!['자유게시판', '질문 답변', '정보공유'].includes(board)) fail('게시판을 확인해주세요.');
    const anon = anonymous(req.body.isAnonymous), incoming = decodeFiles(req.body.files);
    const post = await transaction(async c => {
        const [result] = await c.query('INSERT INTO community_post (board_name,title,content,author_id,is_anonymous) VALUES (?,?,?,?,?)', [board, title, content, req.communityUser.id, anon]);
        const postId = result.insertId;
        if (anon) await numberFor(c, postId, req.communityUser.id);
        await attachments(c, postId, null, incoming);
        return postResult(c, postId, req.communityUser.id);
    });
    res.status(201).json({ post });
}));
router.put('/:id', wrap(async (req, res) => {
    const postId = id(req.params.id), title = text(req.body.title, 200), content = text(req.body.content, 10000), incoming = decodeFiles(req.body.files);
    const post = await transaction(async c => {
        const old = await lockPost(c, postId);
        if (String(old.author_id) !== String(req.communityUser.id)) fail('본인 글만 수정할 수 있습니다.', 403);
        const anon = anonymous(req.body.isAnonymous, !!old.is_anonymous);
        if (anon) await numberFor(c, postId, req.communityUser.id);
        await c.query('UPDATE community_post SET title=?,content=?,is_anonymous=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [title, content, anon, postId]);
        await attachments(c, postId, null, incoming, req.body.removeAttachmentIds);
        return postResult(c, postId, req.communityUser.id);
    }); res.json({ post });
}));
router.put('/:id/resolution', wrap(async (req, res) => {
    const postId = id(req.params.id); if (![0, 1].includes(req.body.isResolved)) fail('해결 상태를 확인해주세요.');
    const post = await transaction(async c => {
        const old = await lockPost(c, postId);
        if (String(old.author_id) !== String(req.communityUser.id) || old.board_name !== '질문 답변') fail('본인 질문만 변경할 수 있습니다.', 403);
        await c.query('UPDATE community_post SET is_resolved=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [req.body.isResolved, postId]);
        return postResult(c, postId, req.communityUser.id);
    }); res.json({ post });
}));
router.delete('/:id', wrap(async (req, res) => {
    await transaction(async c => {
        const postId = id(req.params.id), old = await lockPost(c, postId);
        if (String(old.author_id) !== String(req.communityUser.id)) fail('본인 글만 삭제할 수 있습니다.', 403);
        await c.query('DELETE FROM community_post WHERE id=?', [postId]);
    }); res.json({ message: '삭제되었습니다.' });
}));

router.use(errorHandler);
module.exports = router;
