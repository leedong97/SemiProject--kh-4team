// 직원 평가 API: 모든 변경은 로그인 사용자와 MySQL 권한을 확인합니다.
const express = require("express");
const pool = require("../../db");
const { requireAuth } = require("../../middleware/session");
const { createNotification } = require("../../notify");
const router = express.Router();
router.use(requireAuth);

function validId(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
}
function errorResponse(res, error) {
    console.error("직원 평가 API 오류:", error);
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "같은 프로젝트·직원·기간의 평가가 이미 있습니다." });
    if (error.code === "ER_NO_SUCH_TABLE") return res.status(503).json({ message: "평가 테이블이 없습니다. EVALUATION_MIGRATION.sql을 먼저 실행하세요." });
    res.status(500).json({ message: "평가 처리 중 DB 오류가 발생했습니다." });
}
async function isPm(projectId, employeeId) {
    const [rows] = await pool.query("SELECT 1 FROM projects WHERE project_id = ? AND manager_id = ?", [projectId, employeeId]);
    return rows.length > 0;
}
async function isMember(projectId, employeeId) {
    const [rows] = await pool.query("SELECT 1 FROM project_members WHERE project_id = ? AND employee_id = ?", [projectId, employeeId]);
    return rows.length > 0;
}
async function addHistory(connection, evaluationId, actorId, action, detail) {
    await connection.query("INSERT INTO nexus_evaluation_history (evaluation_id, actor_id, action, detail) VALUES (?, ?, ?, ?)", [evaluationId, actorId, action, detail || null]);
}
async function getEvaluation(id) {
    const [rows] = await pool.query("SELECT * FROM nexus_evaluations WHERE id = ?", [id]);
    return rows[0];
}
function canView(item, user) {
    return user.employee_role === "관리자" || item.evaluator_id === user.employee_id ||
        (item.employee_id === user.employee_id && item.status === "승인");
}
function toClient(row) {
    return {
        id: row.id, projectId: row.project_id, employeeId: row.employee_id,
        evaluatorId: row.evaluator_id, period: row.period,
        projectScore: Number(row.project_score), issueScore: Number(row.issue_score),
        scheduleScore: Number(row.schedule_score), teamworkScore: Number(row.teamwork_score),
        score: Number(row.total_score), feedback: row.feedback, status: row.status,
        rejectReason: row.reject_reason || "", appeal: row.appeal_reason ? { reason: row.appeal_reason, status: row.appeal_status } : null,
        createdAt: row.created_at, updatedAt: row.updated_at
    };
}
router.get("/context", async (req, res) => {
    try {
        const [projects] = await pool.query("SELECT project_id AS id, project_title AS name, manager_id AS managerId FROM projects ORDER BY project_id DESC");
        const [members] = await pool.query("SELECT project_id AS projectId, employee_id AS employeeId FROM project_members");
        const [employees] = await pool.query("SELECT employee_id AS id, employee_name AS name, employee_department AS department, employee_grade AS `rank`, employee_role AS role, employee_status AS status FROM employees WHERE employee_status <> '퇴사' ORDER BY employee_name");
        res.json({ projects, members, employees, loginId: req.user.employee_id, loginRole: req.user.employee_role });
    } catch (error) { errorResponse(res, error); }
});
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM nexus_evaluations ORDER BY updated_at DESC, id DESC");
        const visible = rows.filter(row => canView(row, req.user));
        const ids = visible.map(row => row.id);
        let history = [];
        if (ids.length) {
            const placeholders = ids.map(() => "?").join(",");
            const [items] = await pool.query(`SELECT h.*, e.employee_name AS actor_name FROM nexus_evaluation_history h LEFT JOIN employees e ON e.employee_id = h.actor_id WHERE h.evaluation_id IN (${placeholders}) ORDER BY h.id ASC`, ids);
            history = items;
        }
        res.json(visible.map(row => ({ ...toClient(row), history: history.filter(h => h.evaluation_id === row.id).map(h => ({ action: h.action, detail: h.detail, actorName: h.actor_name, at: h.created_at })) })));
    } catch (error) { errorResponse(res, error); }
});
router.post("/", async (req, res) => {
    const { projectId, employeeId, period, projectScore, issueScore, scheduleScore, teamworkScore, feedback } = req.body || {};
    const p = validId(projectId), e = validId(employeeId);
    const scores = [projectScore, issueScore, scheduleScore, teamworkScore].map(Number);
    if (!p || !e || e === req.user.employee_id || !period || String(period).length > 40 || !String(feedback || "").trim() || scores.some(s => !Number.isFinite(s) || s < 0 || s > 100)) {
        return res.status(400).json({ message: "평가 대상, 기간, 점수(0~100), 의견을 확인하세요." });
    }
    try {
        if (!(await isPm(p, req.user.employee_id)) || !(await isMember(p, e))) return res.status(403).json({ message: "해당 프로젝트 PM만 소속 팀원을 평가할 수 있습니다." });
        const total = Number((scores[0] * .35 + scores[1] * .30 + scores[2] * .15 + scores[3] * .20).toFixed(1));
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [result] = await conn.query("INSERT INTO nexus_evaluations (project_id, employee_id, evaluator_id, period, project_score, issue_score, schedule_score, teamwork_score, total_score, feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [p, e, req.user.employee_id, String(period).trim(), ...scores, total, String(feedback).trim()]);
            await addHistory(conn, result.insertId, req.user.employee_id, "평가 등록", `점수 ${total}`);
            await conn.commit();
            res.status(201).json({ id: result.insertId });
        } catch (error) { await conn.rollback(); errorResponse(res, error); } finally { conn.release(); }
    } catch (error) { errorResponse(res, error); }
});
router.put("/:id", async (req, res) => {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ message: "평가 번호 오류" });
    try {
        const item = await getEvaluation(id);
        if (!item) return res.status(404).json({ message: "평가 없음" });
        if (item.evaluator_id !== req.user.employee_id || !["초안", "반려"].includes(item.status) || !(await isPm(item.project_id, req.user.employee_id))) return res.status(403).json({ message: "작성 PM만 초안·반려 평가를 수정할 수 있습니다." });
        const { projectScore, issueScore, scheduleScore, teamworkScore, feedback } = req.body || {};
        const scores = [projectScore, issueScore, scheduleScore, teamworkScore].map(Number);
        if (scores.some(s => !Number.isFinite(s) || s < 0 || s > 100) || !String(feedback || "").trim()) return res.status(400).json({ message: "점수와 의견을 확인하세요." });
        const total = Number((scores[0] * .35 + scores[1] * .30 + scores[2] * .15 + scores[3] * .20).toFixed(1));
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("UPDATE nexus_evaluations SET project_score=?, issue_score=?, schedule_score=?, teamwork_score=?, total_score=?, feedback=?, status='초안', reject_reason=NULL WHERE id=?", [...scores, total, String(feedback).trim(), id]);
            await addHistory(conn, id, req.user.employee_id, "평가 수정", `점수 ${item.total_score} → ${total}`);
            await conn.commit(); res.json({ message: "수정 완료" });
        } catch (error) { await conn.rollback(); errorResponse(res, error); } finally { conn.release(); }
    } catch (error) { errorResponse(res, error); }
});
router.patch("/:id/status", async (req, res) => {
    const id = validId(req.params.id), status = req.body && req.body.status;
    // 기존 MySQL ENUM의 '승인' 값을 최종 확정 상태로 사용합니다.
    // 따라서 DB 테이블을 변경하지 않아도 평가 이력에 즉시 반영됩니다.
    if (!id || status !== "승인") return res.status(400).json({ message: "평가 확정만 가능합니다." });
    try {
        const item = await getEvaluation(id);
        if (!item) return res.status(404).json({ message: "평가 없음" });
        if (item.evaluator_id !== req.user.employee_id ||
            !["초안", "반려", "승인 요청"].includes(item.status) ||
            !(await isPm(item.project_id, req.user.employee_id)) ||
            !(await isMember(item.project_id, item.employee_id))) {
            return res.status(403).json({ message: "해당 프로젝트의 평가 작성 PM만 평가를 확정할 수 있습니다." });
        }
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            // 동시에 두 번 확정되는 일을 방지합니다.
            const [result] = await conn.query(
                "UPDATE nexus_evaluations SET status='승인', reject_reason=NULL WHERE id=? AND status IN ('초안', '반려', '승인 요청')",
                [id]
            );
            if (result.affectedRows !== 1) {
                await conn.rollback();
                return res.status(409).json({ message: "이미 처리된 평가입니다. 새로고침해 주세요." });
            }
            await addHistory(conn, id, req.user.employee_id, "평가 확정", "PM이 평가를 최종 확정했습니다.");
            await conn.commit();
            res.json({ message: "평가가 확정되었습니다.", status: "승인" });
            // 확정 후 직원에게 알립니다. 알림 오류는 확정 결과에 영향을 주지 않습니다.
            try {
                await createNotification(item.employee_id, "평가", "인사평가 결과가 확정됐어요.", null);
            } catch (notificationError) {
                console.error("평가 확정 알림 오류:", notificationError);
            }
        } catch (error) {
            await conn.rollback();
            errorResponse(res, error);
        } finally {
            conn.release();
        }
    } catch (error) { errorResponse(res, error); }
});
router.post("/:id/appeal", async (req, res) => {
    const id = validId(req.params.id), reason = String(req.body && req.body.reason || "").trim();
    if (!id || !reason) return res.status(400).json({ message: "이의신청 사유를 입력하세요." });
    try {
        const item = await getEvaluation(id);
        if (!item || item.employee_id !== req.user.employee_id || item.status !== "승인" || item.appeal_reason) return res.status(403).json({ message: "본인의 승인된 평가에 한 번만 이의신청할 수 있습니다." });
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("UPDATE nexus_evaluations SET appeal_reason=?, appeal_status='접수' WHERE id=?", [reason, id]);
            await addHistory(conn, id, req.user.employee_id, "이의신청", reason);
            await conn.commit(); res.json({ message: "신청 완료" });
            await createNotificationForManagers("평가", "인사평가 이의신청이 접수됐어요.", null, [item.evaluator_id, item.employee_id]);
        } catch (error) { await conn.rollback(); errorResponse(res, error); } finally { conn.release(); }
    } catch (error) { errorResponse(res, error); }
});
router.patch("/:id/appeal", async (req, res) => {
    const id = validId(req.params.id), result = req.body && req.body.result;
    if (!id || !["수용", "기각"].includes(result)) return res.status(400).json({ message: "처리 결과 오류" });
    try {
        const item = await getEvaluation(id);
        if (!item || item.appeal_status !== "접수" || req.user.employee_role !== "관리자" || item.employee_id === req.user.employee_id || item.evaluator_id === req.user.employee_id) return res.status(403).json({ message: "담당 관리자만 처리할 수 있습니다." });
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("UPDATE nexus_evaluations SET appeal_status=? WHERE id=?", [result, id]);
            await addHistory(conn, id, req.user.employee_id, "이의신청 " + result, String(req.body.comment || ""));
            await conn.commit(); res.json({ message: "처리 완료" });
            await createNotification(item.employee_id, "평가", "신청한 인사평가 이의신청이 " + result + "됐어요.", null);
        } catch (error) { await conn.rollback(); errorResponse(res, error); } finally { conn.release(); }
    } catch (error) { errorResponse(res, error); }
});
module.exports = router;
