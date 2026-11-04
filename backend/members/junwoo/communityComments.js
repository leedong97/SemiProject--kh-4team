const express = require("express");
const db = require("../../db");
const { createNotification } = require("../../notify");

const { session, requireUser } = require('../dong/communitySession');
const { wrap, fail, id, text, anonymous, transaction, numberFor, decodeFiles, attachments, present, lockPost, errorHandler } = require('./communitySupport');

const router = express.Router();
router.use(session, requireUser);

// ===================================
// 특정 게시글의 댓글 조회
// ===================================

router.get("/", async function (req, res) {
    const postId = Number(req.query.postId);

    if (!Number.isSafeInteger(postId) || postId < 1) {
        return res.status(400).json({
            message: "게시글 번호를 확인해주세요."
        });
    }

    try {
        const [comments] = await db.query(
            `SELECT
                c.id,
                c.post_id AS postId,
                c.author_id AS authorId,
                c.is_anonymous AS isAnonymous,
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                c.parent_id AS parentId,
                c.is_deleted AS isDeleted,
                CASE
            WHEN c.is_deleted = 1 THEN '삭제된 댓글입니다.'
            ELSE c.content
            END AS content,
                c.created_at AS createdAt,
                c.updated_at AS updatedAt
             FROM community_comment c
             LEFT JOIN employees e
                ON c.author_id = e.employee_id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC, c.id ASC`,
            [postId]
        );

        res.json(await present(db, comments, req.communityUser.id, 'comment'));
    } catch (error) {
        console.error("댓글 조회 오류:", error);

        res.status(500).json({
            message: "댓글을 불러오지 못했습니다."
        });
    }
});

// ===================================
router.post('/', wrap(async (req, res) => {
    const postId = id(req.body.postId), parentId = req.body.parentId == null ? null : id(req.body.parentId), content = text(req.body.content, 1000);
    const anon = anonymous(req.body.isAnonymous), incoming = decodeFiles(req.body.files), user = req.communityUser;
    const result = await transaction(async c => {
        const post = await lockPost(c, postId); let parent;
        if (parentId) { const [rows] = await c.query('SELECT * FROM community_comment WHERE id=? AND post_id=?', [parentId, postId]); parent = rows[0]; if (!parent || parent.parent_id != null || parent.is_deleted) fail('답글 대상 댓글이 없습니다.'); }
        const n = anon ? await numberFor(c, postId, user.id) : null;
        const [saved] = await c.query('INSERT INTO community_comment (post_id,author_id,content,parent_id,is_anonymous) VALUES (?,?,?,?,?)', [postId, user.id, content, parentId, anon]);
        await attachments(c, postId, saved.insertId, incoming);
        return { id: saved.insertId, n, post, parent };
    });
    const writerName = anon ? '익명' + result.n : user.name;
    const notifications = [];
    if (result.parent && String(result.parent.author_id) !== String(user.id)) {
        notifications.push([result.parent.author_id, writerName + '님이 내 댓글에 답글을 남겼어요.']);
    }
    if (String(result.post.author_id) !== String(user.id) && String(result.post.author_id) !== String(result.parent?.author_id)) {
        notifications.push([result.post.author_id, writerName + '님이 내 글 "' + result.post.title + '"에 댓글을 남겼어요.']);
    }
    for (const [recipient, message] of notifications) {
        try { await createNotification(recipient, '커뮤니티', message, '/community/post/' + postId); }
        catch (e) { console.error('댓글 알림 실패:', e.code); }
    }
    res.status(201).json({ id: result.id });
}));
for (const method of ['put', 'delete']) router[method]('/:id', wrap(async (req, res) => {
    const commentId = id(req.params.id), incoming = method === 'put' ? decodeFiles(req.body.files) : [];
    const [found] = await db.query('SELECT post_id FROM community_comment WHERE id=?', [commentId]); if (!found.length) fail('댓글이 없습니다.', 404);
    await transaction(async c => {
        await lockPost(c, found[0].post_id);
        const [rows] = await c.query('SELECT * FROM community_comment WHERE id=? FOR UPDATE', [commentId]); const old = rows[0];
        if (!old || old.is_deleted || String(old.author_id) !== String(req.communityUser.id)) fail('본인 댓글만 변경할 수 있습니다.', 403);
        if (method === 'delete') {
            await c.query("UPDATE community_comment SET content='',is_deleted=1 WHERE id=?", [commentId]);
            await c.query('DELETE FROM community_attachment WHERE comment_id=?', [commentId]);
        } else {
            const anon = anonymous(req.body.isAnonymous, !!old.is_anonymous);
            if (anon) await numberFor(c, old.post_id, req.communityUser.id);
            await c.query('UPDATE community_comment SET content=?,is_anonymous=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [text(req.body.content, 1000), anon, commentId]);
            await attachments(c, old.post_id, commentId, incoming, req.body.removeAttachmentIds);
        }
    }); res.json({ message: '처리되었습니다.' });
}));

// 내가 작성한 댓글 조회
router.get("/mine", async function (req, res) {
    const authorId = req.communityUser.id;

    if (!Number.isSafeInteger(authorId) || authorId < 1) {
        return res.status(400).json({
            message: "작성자 정보를 확인해주세요."
        });
    }

    try {
        const [comments] = await db.query(
            `SELECT
                c.id,
                c.post_id AS postId,
                c.content,
                c.created_at AS createdAt,
                p.title AS postTitle,
                p.board_name AS boardName
             FROM community_comment c
             JOIN community_post p
                ON c.post_id = p.id
             WHERE c.author_id = ?
            AND c.is_deleted = 0
            ORDER BY c.created_at DESC, c.id DESC`,
            [authorId]
        );

        res.json(comments);
    } catch (error) {
        console.error("내 댓글 조회 오류:", error);

        res.status(500).json({
            message: "내 댓글을 불러오지 못했습니다."
        });
    }
});


router.use(errorHandler);
module.exports = router;
