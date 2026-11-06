const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../../db");
const { requireAuth, requireManager } = require("../../middleware/session");
const router = express.Router();
router.use(requireAuth, requireManager);
const { createNotification } = require("../../notify");

// 승인된 휴가 기간에만 휴가 표시. 휴직과 퇴사는 우선 적용
const statusSql = `CASE
    WHEN e.employee_status IN ('퇴사', '휴직') THEN e.employee_status
    WHEN EXISTS (SELECT 1 FROM leave_requests l WHERE l.employee_id = e.employee_id
        AND l.status = '승인' AND DATE(UTC_TIMESTAMP() + INTERVAL 9 HOUR) BETWEEN l.start_date AND l.end_date)
    THEN '휴가' ELSE e.employee_status END`;


router.post("/employees", async (req, res) => {
    const { employee_code, employee_name, employee_email, employee_pw, employee_department, employee_grade, employee_position } = req.body || {};
    if (!/^[A-Za-z0-9-]{2,20}$/.test(employee_code || '') || !String(employee_name || '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee_email || '') || typeof employee_pw !== 'string' || employee_pw.length < 8 || Buffer.byteLength(employee_pw, 'utf8') > 72) return res.status(400).json({ message: "사원코드, 이름, 이메일, 초기 비밀번호(8자 이상)를 확인하세요." });
    try {
        const hash = await bcrypt.hash(employee_pw, 10);
        const [result] = await pool.query(`INSERT INTO employees (employee_code, employee_name, employee_email, employee_pw, employee_department, employee_grade, employee_position, employee_role, employee_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, '일반 사용자', '재직')`, [employee_code, employee_name.trim(), employee_email.trim(), hash, employee_department || null, employee_grade || '사원', employee_position || null]);
        res.status(201).json({ employee_id: result.insertId, message: "직원 등록 완료" });
    } catch (error) { console.error(error); res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ message: error.code === 'ER_DUP_ENTRY' ? "중복된 사원코드 또는 이메일입니다." : "직원 등록 실패: 필수 DB 컬럼을 확인하세요." }); }
});

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

router.patch("/leaves/:id", async (req, res) => {
    const id = Number(req.params.id); const { status } = req.body || {};
    if (!Number.isInteger(id) || !["승인", "반려"].includes(status)) return res.status(400).json({ message: "승인 또는 반려를 선택하세요." });
    try {
        const [result] = await pool.query("UPDATE leave_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE leave_id = ? AND status = '대기'", [status, req.user.employee_id, id]);
        if (!result.affectedRows) return res.status(409).json({ message: "대기 중인 휴가가 아닙니다." });
        // 휴가 승인 또는 반려 후 직원에게 알림 생성
        try {
            const [leaveRows] = await pool.query(
                `SELECT
            employee_id,
            leave_type,
            DATE_FORMAT(start_date, '%m/%d') AS s,
            DATE_FORMAT(end_date, '%m/%d') AS e
         FROM leave_requests
         WHERE leave_id = ?`,
                [id]
            );

            if (leaveRows[0]) {
                const r = leaveRows[0];

                // 휴가 기간 표시
                const period = r.s === r.e
                    ? r.s
                    : r.s + "~" + r.e;

                // 직원에게 알림 저장
                await createNotification(
                    r.employee_id,
                    "휴가",
                    "신청한 휴가(" + period + " " + r.leave_type + ")가 " + status + "됐어요.",
                    null
                );
            }
        } catch (notifyError) {
            console.error("휴가 알림 생성 오류:", notifyError.message);
        }
        res.json({ message: "휴가 " + status + " 완료. 현재 날짜가 휴가 기간이면 직원 조회에서 휴가로 표시됩니다." });
    } catch (error) { console.error(error); res.status(500).json({ message: "휴가 처리 실패" }); }
});
// 직원별 업무 현황: 프로젝트/참여 직원/담당 이슈를 MySQL에서 직접 조회합니다.
router.get("/work-overview", async (req, res) => {
    try {
        // 배포된 DB마다 이슈 상태/마감일 컬럼명이 다를 수 있어 실제 컬럼을 확인합니다.
        const [columns] = await pool.query("SHOW COLUMNS FROM issues");
        const names = columns.map(column => column.Field);
        function chooseColumn(candidates) {
            for (const name of candidates) {
                if (names.includes(name)) return "i.`" + name + "`";
            }
            return null;
        }
        const statusColumn = chooseColumn(["issue_status", "status"]);
        const dueColumn = chooseColumn(["issue_due_date", "due_date", "deadline", "end_date"]);
        const statusSql = statusColumn ? statusColumn + " AS status" : "NULL AS status";
        const dueSql = dueColumn ? "DATE_FORMAT(" + dueColumn + ", '%Y-%m-%d') AS due" : "NULL AS due";

        const [projectResult, memberResult, issueResult] = await Promise.all([
            pool.query("SELECT project_id AS id, project_title AS name, manager_id AS managerId, status FROM projects"),
            pool.query("SELECT project_id AS projectId, employee_id AS employeeId FROM project_members"),
            pool.query(`SELECT i.issue_id AS id, i.project_id AS projectId,
                i.issue_title AS title, ${statusSql},
                i.assigned_employee_id AS assigneeId, ${dueSql},
                p.project_title AS projectName
                FROM issues i LEFT JOIN projects p ON p.project_id = i.project_id
                ORDER BY i.issue_id DESC`)
        ]);
        res.json({ projects: projectResult[0], members: memberResult[0], issues: issueResult[0] });
    } catch (error) {
        console.error("인사 업무 현황 조회 오류:", error);
        res.status(500).json({ message: "업무 현황 조회 실패: " + (error.code || "서버 오류") });
    }
});

module.exports = router;
