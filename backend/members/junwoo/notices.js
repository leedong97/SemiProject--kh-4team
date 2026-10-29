const express = require("express");
const pool = require("../../db");
const router = express.Router();

// 공지사항 목록: 실제 employees 테이블에서 작성자 이름 조회
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT n.notice_id AS id, n.title, n.content, n.employee_id,
                   COALESCE(e.employee_name, '알 수 없음') AS author,
                   DATE_FORMAT(n.created_at, '%Y-%m-%d') AS date,
                   n.views, n.is_pinned AS important
            FROM notices n
            LEFT JOIN employees e ON n.employee_id = e.employee_id
            ORDER BY n.is_pinned DESC, n.notice_id DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error("공지사항 조회 오류:", error);
        res.status(500).json({ message: "공지사항 조회 실패" });
    }
});

// 입력값 검증
function validText(title, content) {
    return typeof title === "string" && title.trim().length > 0 &&
        title.trim().length <= 200 && typeof content === "string" && content.trim().length > 0;
}

// 공지사항 등록 (학습용: 직원 번호를 요청 본문에서 받음)
router.post("/", async (req, res) => {
    try {
        const { title, content, important = false, employee_id } = req.body;
        if (!validText(title, content)) {
            return res.status(400).json({ message: "제목(200자 이하)과 내용을 확인해주세요." });
        }
        if (!Number.isInteger(employee_id) || employee_id <= 0) {
            return res.status(400).json({ message: "유효한 직원 번호를 입력해주세요." });
        }
        const [employees] = await pool.query(
            "SELECT employee_id FROM employees WHERE employee_id = ?", [employee_id]
        );
        if (employees.length === 0) {
            return res.status(400).json({ message: "존재하지 않는 직원 번호입니다." });
        }
        const [result] = await pool.query(
            "INSERT INTO notices (title, content, employee_id, is_pinned) VALUES (?, ?, ?, ?)",
            [title.trim(), content.trim(), employee_id, important ? 1 : 0]
        );
        res.status(201).json({ message: "등록 성공", id: result.insertId });
    } catch (error) {
        console.error("공지사항 등록 오류:", error);
        res.status(500).json({ message: "공지사항 등록 실패" });
    }
});

// 공지사항 수정
router.put("/:id", async (req, res) => {
    try {
        const { title, content, important = false } = req.body;
        if (!validText(title, content)) {
            return res.status(400).json({ message: "제목과 내용을 확인해주세요." });
        }
        const [result] = await pool.query(
            "UPDATE notices SET title = ?, content = ?, is_pinned = ? WHERE notice_id = ?",
            [title.trim(), content.trim(), important ? 1 : 0, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "공지사항이 없습니다." });
        res.json({ message: "수정 성공" });
    } catch (error) {
        console.error("공지사항 수정 오류:", error);
        res.status(500).json({ message: "공지사항 수정 실패" });
    }
});

// 공지사항 삭제
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM notices WHERE notice_id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "공지사항이 없습니다." });
        res.json({ message: "삭제 성공" });
    } catch (error) {
        console.error("공지사항 삭제 오류:", error);
        res.status(500).json({ message: "공지사항 삭제 실패" });
    }
});

// 상세페이지 조회수 증가
router.patch("/:id/views", async (req, res) => {
    try {
        const [result] = await pool.query(
            "UPDATE notices SET views = views + 1 WHERE notice_id = ?", [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "공지사항이 없습니다." });
        res.json({ message: "조회수 증가 성공" });
    } catch (error) {
        console.error("조회수 증가 오류:", error);
        res.status(500).json({ message: "조회수 변경 실패" });
    }
});

module.exports = router;
