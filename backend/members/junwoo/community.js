const express = require("express");
const db = require("../../db");

const router = express.Router();

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
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                p.created_at AS createdAt,
                p.updated_at AS updatedAt,
                p.is_resolved AS isResolved
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
            posts: posts,
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

// 게시글 등록
router.post("/", async function (req, res) {
    const title = req.body.title;
    const content = req.body.content;
    const boardName = req.body.boardName;
    const authorId = Number(req.body.authorId);

    // 제목 검사
    if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({
            message: "제목을 입력해주세요."
        });
    }

    if (title.trim().length > 200) {
        return res.status(400).json({
            message: "제목은 200자까지 입력할 수 있습니다."
        });
    }

    // 내용 검사
    if (typeof content !== "string" || content.trim() === "") {
        return res.status(400).json({
            message: "내용을 입력해주세요."
        });
    }

    if (content.trim().length > 10000) {
        return res.status(400).json({
            message: "내용은 10000자까지 입력할 수 있습니다."
        });
    }

    // 게시판 종류 검사
    const boards = ["자유게시판", "질문 답변", "정보공유"];

    if (!boards.includes(boardName)) {
        return res.status(400).json({
            message: "게시판을 확인해주세요."
        });
    }

    // 작성자 ID 검사
    if (!Number.isSafeInteger(authorId) || authorId < 1) {
        return res.status(400).json({
            message: "작성자 정보를 확인해주세요."
        });
    }

    try {
        // 실제 등록된 재직 직원인지 확인
        // 이 검사는 로그인 인증을 대신하지는 않습니다.
        const [employees] = await db.query(
            `SELECT employee_id, employee_name
             FROM employees
             WHERE employee_id = ?
               AND employee_status = '재직'`,
            [authorId]
        );

        if (employees.length === 0) {
            return res.status(400).json({
                message: "등록 가능한 직원 정보를 찾지 못했습니다."
            });
        }

        // DB에 저장
        const [result] = await db.query(
            `INSERT INTO community_post (
                board_name,
                title,
                content,
                author_id
             )
             VALUES (?, ?, ?, ?)`,
            [
                boardName,
                title.trim(),
                content.trim(),
                authorId
            ]
        );

        // 저장된 글을 React에서 사용할 이름으로 조회
        const [rows] = await db.query(
            `SELECT
                id,
                board_name AS boardName,
                title,
                content,
                author_id AS authorId,
                created_at AS createdAt,
                updated_at AS updatedAt
             FROM community_post
             WHERE id = ?`,
            [result.insertId]
        );

        const savedPost = rows[0];

        savedPost.authorName = employees[0].employee_name;

        res.status(201).json({
            message: "게시글이 등록되었습니다.",
            post: savedPost
        });
    } catch (error) {
        console.error("커뮤니티 글 등록 오류:", error);

        res.status(500).json({
            message: "게시글 등록에 실패했습니다."
        });
    }
});

// 게시글 수정
router.put("/:id", async function (req, res) {
    const id = Number(req.params.id);
    const authorId = Number(req.body.authorId);
    const title = req.body.title;
    const content = req.body.content;

    if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 작성자 정보를 확인해주세요."
        });
    }

    if (
        typeof title !== "string" ||
        title.trim() === "" ||
        title.trim().length > 200
    ) {
        return res.status(400).json({
            message: "제목은 1~200자로 입력해주세요."
        });
    }

    if (
        typeof content !== "string" ||
        content.trim() === "" ||
        content.trim().length > 10000
    ) {
        return res.status(400).json({
            message: "내용은 1~10000자로 입력해주세요."
        });
    }

    try {
        // 전달된 작성자 ID와 일치하는 글만 수정
        const [result] = await db.query(
            `UPDATE community_post
             SET title = ?,
                 content = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?
               AND author_id = ?`,
            [
                title.trim(),
                content.trim(),
                id,
                authorId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "수정할 글이 없거나 작성자가 일치하지 않습니다."
            });
        }

        // 수정된 글을 다시 조회
        const [rows] = await db.query(
            `SELECT
                p.id,
                p.board_name AS boardName,
                p.title,
                p.content,
                p.author_id AS authorId,
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                p.created_at AS createdAt,
                p.updated_at AS updatedAt,
                p.is_resolved AS isResolved
             FROM community_post p
             LEFT JOIN employees e
                ON p.author_id = e.employee_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "게시글이 더 이상 존재하지 않습니다."
            });
        }

        res.json({
            message: "게시글이 수정되었습니다.",
            post: rows[0]
        });
    } catch (error) {
        console.error("커뮤니티 글 수정 오류:", error);

        res.status(500).json({
            message: "게시글 수정에 실패했습니다."
        });
    }
});

// 게시글 삭제
router.delete("/:id", async function (req, res) {
    const id = Number(req.params.id);
    const authorId = Number(req.body.authorId);

    if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 작성자 정보를 확인해주세요."
        });
    }

    try {
        const [result] = await db.query(
            `DELETE FROM community_post
             WHERE id = ?
               AND author_id = ?`,
            [id, authorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "삭제할 글이 없거나 작성자가 일치하지 않습니다."
            });
        }

        res.json({
            message: "게시글이 삭제되었습니다."
        });
    } catch (error) {
        console.error("커뮤니티 글 삭제 오류:", error);

        res.status(500).json({
            message: "게시글 삭제에 실패했습니다."
        });
    }
});

// 질문 해결 상태 변경
router.put("/:id/resolution", async function (req, res) {
    const id = Number(req.params.id);
    const authorId = Number(req.body.authorId);
    const isResolved = req.body.isResolved;

    if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        !Number.isSafeInteger(authorId) ||
        authorId < 1
    ) {
        return res.status(400).json({
            message: "게시글 또는 작성자 정보를 확인해주세요."
        });
    }

    if (isResolved !== 0 && isResolved !== 1) {
        return res.status(400).json({
            message: "올바른 해결 상태를 선택해주세요."
        });
    }

    try {
        // 질문 답변 게시판이면서 작성자가 일치하는 글만 변경
        const [result] = await db.query(
            `UPDATE community_post
             SET is_resolved = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?
               AND author_id = ?
               AND board_name = '질문 답변'`,
            [isResolved, id, authorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "변경할 질문이 없거나 작성자가 일치하지 않습니다."
            });
        }

        // 변경된 게시글 반환
        const [rows] = await db.query(
            `SELECT
                p.id,
                p.board_name AS boardName,
                p.title,
                p.content,
                p.author_id AS authorId,
                COALESCE(
                    e.employee_name,
                    '작성자 미등록'
                ) AS authorName,
                p.created_at AS createdAt,
                p.updated_at AS updatedAt,
                p.is_resolved AS isResolved
             FROM community_post p
             LEFT JOIN employees e
                ON p.author_id = e.employee_id
             WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "게시글이 더 이상 존재하지 않습니다."
            });
        }

        res.json({
            message: "질문 상태가 변경되었습니다.",
            post: rows[0]
        });
    } catch (error) {
        console.error("질문 상태 변경 오류:", error);

        res.status(500).json({
            message: "질문 상태 변경에 실패했습니다."
        });
    }
});

module.exports = router;