const express = require("express");
const pool = require("../../db");
const { requireAuth, requireManager } = require("../../middleware/session");
const router = express.Router();
router.use(requireAuth, requireManager);
const grades = ["팀장", "부장", "이사", "대표"];
router.get("/overdue-projects", async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT p.project_id, p.project_title, p.end_date, p.status,
            DATEDIFF(CURDATE(), p.end_date) AS overdue_days, COUNT(i.issue_id) AS issue_count
            FROM projects p LEFT JOIN issues i ON i.project_id = p.project_id
            WHERE p.end_date < CURDATE() AND p.status <> '완료'
            GROUP BY p.project_id, p.project_title, p.end_date, p.status ORDER BY p.end_date ASC`);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ message: "기간 초과 프로젝트 조회 실패" }); }
});
router.get("/overdue-projects/:id/issues", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "프로젝트 번호 오류" });
    try {
        const [rows] = await pool.query("SELECT issue_id, project_id, issue_title, issue_status, issue_priority, issue_due_date FROM issues WHERE project_id = ? ORDER BY issue_created_at DESC", [id]);
        res.json(rows);
    } catch (error) { console.error(error); res.status(500).json({ message: "이슈 조회 실패" }); }
});
// 직원 평가 권한 판단에 필요한 실제 프로젝트/팀원 관계만 제공합니다.
router.get("/evaluation-context", async (req, res) => {
    try {
        const [projects] = await pool.query(
            "SELECT project_id AS id, project_title AS name, manager_id AS managerId FROM projects"
        );
        const [members] = await pool.query(
            "SELECT project_id AS projectId, employee_id AS employeeId FROM project_members"
        );
        res.json({ projects, members });
    } catch (error) {
        console.error("평가 대상 조회 오류:", error);
        res.status(500).json({ message: "프로젝트 담당자/참여자 조회에 실패했습니다." });
    }
});

// 프로젝트 담당자(PM)만 해당 프로젝트의 팀원을 평가할 수 있습니다.
// 관리자 권한만 있다고 다른 프로젝트 팀원을 평가할 수는 없습니다.
router.post("/evaluations", async (req, res) => {
    const { project_id, employee_id, evaluation_period, evaluation_score, evaluation_comment } = req.body || {};
    const projectId = Number(project_id);
    const employeeId = Number(employee_id);
    const score = Number(evaluation_score);
    if (!Number.isInteger(projectId) || projectId <= 0 ||
        !Number.isInteger(employeeId) || employeeId <= 0 ||
        !Number.isFinite(score) || score < 0 || score > 100 ||
        typeof evaluation_period !== "string" || !evaluation_period.trim() ||
        evaluation_period.length > 20 ||
        typeof evaluation_comment !== "string" || !evaluation_comment.trim()) {
        return res.status(400).json({ message: "평가 입력값을 확인하세요." });
    }
    if (employeeId === req.user.employee_id) {
        return res.status(403).json({ message: "본인은 평가할 수 없습니다." });
    }
    try {
        const [projects] = await pool.query(
            "SELECT project_id FROM projects WHERE project_id = ? AND manager_id = ?",
            [projectId, req.user.employee_id]
        );
        if (projects.length === 0) {
            return res.status(403).json({ message: "해당 프로젝트 담당자만 평가할 수 있습니다." });
        }
        const [members] = await pool.query(
            `SELECT pm.employee_id FROM project_members pm
             JOIN employees e ON e.employee_id = pm.employee_id
             WHERE pm.project_id = ? AND pm.employee_id = ? AND e.employee_status = '재직'`,
            [projectId, employeeId]
        );
        if (members.length === 0) {
            return res.status(403).json({ message: "해당 프로젝트의 재직 팀원만 평가할 수 있습니다." });
        }
        const [result] = await pool.query(
            `INSERT INTO employee_evaluations
             (project_id, employee_id, evaluator_id, evaluation_period, evaluation_score,
              evaluation_comment, evaluation_status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, '초안', NOW(), NOW())`,
            [projectId, employeeId, req.user.employee_id, evaluation_period.trim(), score,
                evaluation_comment.trim()]
        );
        res.status(201).json({ evaluation_id: result.insertId, message: "평가 등록 완료" });
    } catch (error) {
        console.error("평가 저장 오류:", error);
        res.status(500).json({ message: "평가 DB 저장에 실패했습니다." });
    }
});
module.exports = router;
