const express = require("express");
const pool = require("../../db");
const { requireAuth, requireManager } = require("../../middleware/session");
const router = express.Router();
router.use(requireAuth, requireManager);

// 승인된 휴가 기간에만 휴가 표시. 휴직과 퇴사는 우선 적용
const statusSql = `CASE
    WHEN e.employee_status IN ('퇴사', '휴직') THEN e.employee_status
    WHEN EXISTS (SELECT 1 FROM leave_requests l WHERE l.employee_id = e.employee_id
        AND l.status = '승인' AND DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR) BETWEEN l.start_date AND l.end_date)
    THEN '휴가' ELSE e.employee_status END`;

router.get("/employees", async (req, res) => {
    try {
        const sort = { salary: "e.employee_salary DESC", department: "e.employee_department ASC", grade: "FIELD(e.employee_grade, '대표', '이사', '부장', '차장', '과장', '팀장', '대리', '사원') ASC" };
        const order = sort[req.query.sort] || "e.employee_id ASC";
        const [rows] = await pool.query(`SELECT e.employee_id, e.employee_code, e.employee_name, e.employee_department,
            e.employee_division, e.employee_team, e.employee_position, e.employee_grade,
            e.employee_role, e.employee_status, e.employee_salary,
            DATE_FORMAT(e.employee_hire_date, '%Y-%m-%d') AS employee_hire_date,
            DATE_FORMAT(e.employee_retired_at, '%Y-%m-%d') AS employee_retired_at, ${statusSql} AS display_status
            FROM employees e WHERE e.employee_status <> '퇴사' ORDER BY ${order}`);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ message: "직원 조회 실패" }); }
});
router.get("/retired", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT employee_id, employee_name, employee_department,
            employee_position, employee_grade,
            DATE_FORMAT(employee_hire_date, '%Y-%m-%d') AS employee_hire_date,
            DATE_FORMAT(employee_retired_at, '%Y-%m-%d') AS employee_retired_at
            FROM employees WHERE employee_status = '퇴사' ORDER BY employee_retired_at DESC, employee_id DESC`);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ message: "퇴사자 조회 실패" }); }
});
router.patch("/employees/:id", async (req, res) => {
    const id = Number(req.params.id);
    const fields = { employee_department: "부서", employee_grade: "직급", employee_salary: "연봉" };
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "직원 번호 오류" });
    const keys = Object.keys(req.body || {});
    if (!keys.length || keys.some(k => !fields[k])) return res.status(400).json({ message: "수정 항목 오류" });
    for (const key of keys) {
        const value = req.body[key];
        if (key === "employee_salary" && (!Number.isInteger(value) || value < 0 || value > 2147483647)) return res.status(400).json({ message: "연봉 값 오류" });
        if (key !== "employee_salary" && (typeof value !== "string" || !value.trim() || value.length > (key === "employee_grade" ? 20 : 100))) return res.status(400).json({ message: "문자 입력값 오류" });
    }
    let conn;
    try {
        conn = await pool.getConnection(); await conn.beginTransaction();
        const [rows] = await conn.query("SELECT employee_department, employee_grade, employee_salary, employee_status FROM employees WHERE employee_id = ? FOR UPDATE", [id]);
        if (!rows[0] || rows[0].employee_status === "퇴사") { await conn.rollback(); return res.status(404).json({ message: "수정할 직원이 없습니다." }); }
        for (const key of keys) {
            const before = rows[0][key]; const after = req.body[key];
            if (String(before ?? "") === String(after)) continue;
            await conn.query(`UPDATE employees SET ${key} = ? WHERE employee_id = ?`, [after, id]);
            await conn.query("INSERT INTO employee_change_logs (employee_id, changed_by, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)", [id, req.user.employee_id, key, before == null ? null : String(before), String(after)]);
        }
        await conn.commit(); res.json({ message: "직원 정보 수정 완료" });
    } catch (error) { if (conn) await conn.rollback(); console.error(error); res.status(500).json({ message: "직원 수정 실패: 변경 이력 테이블 구조를 확인하세요." }); }
    finally { if (conn) conn.release(); }
});
router.patch("/employees/:id/retire", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || id === req.user.employee_id) return res.status(400).json({ message: "퇴사 처리할 직원을 확인하세요." });
    try {
        const [result] = await pool.query("UPDATE employees SET employee_status = '퇴사', employee_retired_at = CURDATE() WHERE employee_id = ? AND employee_status <> '퇴사'", [id]);
        if (!result.affectedRows) return res.status(404).json({ message: "대상 직원이 없거나 이미 퇴사했습니다." });
        res.json({ message: "퇴사 처리 완료" });
    } catch (error) { console.error(error); res.status(500).json({ message: "퇴사 처리 실패" }); }
});
router.get("/leaves", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT leave_id, employee_id, leave_type, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status, reviewed_by, reviewed_at FROM leave_requests ORDER BY created_at DESC");
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ message: "휴가 조회 실패" }); }
});
router.post("/leaves", async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, leave_reason } = req.body || {};
    if (!Number.isInteger(employee_id) || typeof leave_type !== "string" || !leave_type.trim() || leave_type.length > 20 || !/^\d{4}-\d{2}-\d{2}$/.test(start_date || "") || !/^\d{4}-\d{2}-\d{2}$/.test(end_date || "") || start_date > end_date) return res.status(400).json({ message: "휴가 입력값 오류" });
    let conn;
    try {
        conn = await pool.getConnection(); await conn.beginTransaction();
        const [employees] = await conn.query("SELECT employee_status FROM employees WHERE employee_id = ? FOR UPDATE", [employee_id]);
        if (!employees[0] || employees[0].employee_status !== "재직") { await conn.rollback(); return res.status(400).json({ message: "재직 중인 직원만 신청 가능합니다." }); }
        const [overlaps] = await conn.query("SELECT leave_id FROM leave_requests WHERE employee_id = ? AND status <> '반려' AND start_date <= ? AND end_date >= ? LIMIT 1", [employee_id, end_date, start_date]);
        if (overlaps.length) { await conn.rollback(); return res.status(409).json({ message: "겹치는 휴가 신청이 있습니다." }); }
        const [result] = await conn.query("INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, leave_reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, '대기', NOW(), NOW())", [employee_id, leave_type.trim(), start_date, end_date, leave_reason || null]);
        await conn.commit(); res.status(201).json({ leave_id: result.insertId, status: "대기" });
    } catch (error) { if (conn) await conn.rollback(); console.error(error); res.status(500).json({ message: "휴가 등록 실패" }); }
    finally { if (conn) conn.release(); }
});
router.patch("/leaves/:id", async (req, res) => {
    const id = Number(req.params.id); const { status } = req.body || {};
    if (!Number.isInteger(id) || !["승인", "반려"].includes(status)) return res.status(400).json({ message: "승인 또는 반려를 선택하세요." });
    try {
        const [result] = await pool.query("UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE leave_id = ? AND status = '대기'", [status, req.user.employee_id, id]);
        if (!result.affectedRows) return res.status(409).json({ message: "대기 중인 휴가가 아닙니다." });
        res.json({ message: "휴가 " + status + " 완료. 현재 날짜가 휴가 기간이면 직원 조회에서 휴가로 표시됩니다." });
    } catch (error) { console.error(error); res.status(500).json({ message: "휴가 처리 실패" }); }
});
module.exports = router;
