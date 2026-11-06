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

// 등록 폼에서 선택할 실제 프로젝트와 고객사 목록
router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT p.project_id, p.project_title,
            c.customer_name, DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date
            FROM projects p LEFT JOIN customers c ON c.customer_id = p.customer_id
            ORDER BY p.project_id DESC`);
        res.json(rows);
    } catch (error) {
        console.error('프로젝트 목록 조회 실패:', error);
        res.status(500).json({ message: '프로젝트 목록 조회 실패' });
    }
});

// 이슈 조회: 프로젝트·고객사·마감일을 함께 반환합니다.
// DB에 있는 모든 이슈와 프로젝트/고객사 정보를 한 번에 조회합니다.
router.get('/issues', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT i.issue_id AS id, i.project_id AS projectId,
            i.issue_title AS title, i.issue_description AS description,
            i.issue_status AS status, i.issue_priority AS priority,
            i.assigned_employee_id AS assigneeId,
            e.employee_name AS assigneeName,
            mover.employee_name AS deletedBy,
            i.nexus_draft_by AS deletedById,
            DATE_FORMAT(i.nexus_draft_at, '%Y-%m-%d %H:%i:%s') AS deletedAt,
            DATE_FORMAT(i.issue_due_date, '%Y-%m-%d') AS due,
            DATE_FORMAT(i.issue_created_at, '%Y-%m-%d') AS createdAt,
            DATE_FORMAT(i.issue_resolved_at, '%Y-%m-%d') AS resolvedAt,
            p.project_title AS projectName, c.customer_name AS customerName,
            DATE_FORMAT(p.end_date, '%Y-%m-%d') AS projectEndDate
            FROM issues i
            LEFT JOIN employees e ON e.employee_id = i.assigned_employee_id
            LEFT JOIN employees mover ON mover.employee_id = i.nexus_draft_by
            LEFT JOIN projects p ON p.project_id = i.project_id
            LEFT JOIN customers c ON c.customer_id = p.customer_id
            ORDER BY i.issue_id DESC`);
        res.json(rows);
    } catch (error) {
        console.error('이슈 DB 조회 오류:', error);
        res.status(500).json({ message: '이슈 DB 조회 실패' });
    }
});

router.post('/issues', async (req, res) => {
    const { title, description, projectId, assigneeId, due, priority } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.length > 255 ||
        !Number.isInteger(Number(projectId)) || Number(projectId) <= 0 ||
        !['낮음', '보통', '높음', '긴급'].includes(priority)) {
        return res.status(400).json({ message: '프로젝트, 제목, 우선순위를 확인하세요.' });
    }
    if (assigneeId != null && (!Number.isInteger(Number(assigneeId)) || Number(assigneeId) <= 0)) {
        return res.status(400).json({ message: '담당자 번호 오류' });
    }
    if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        return res.status(400).json({ message: '마감일 형식 오류' });
    }
    try {
        const [projects] = await pool.query('SELECT project_id FROM projects WHERE project_id = ?', [projectId]);
        if (!projects.length) return res.status(404).json({ message: '프로젝트가 없습니다.' });
        if (assigneeId != null) {
            const [employees] = await pool.query('SELECT employee_id FROM employees WHERE employee_id = ?', [assigneeId]);
            if (!employees.length) return res.status(400).json({ message: '담당자가 존재하지 않습니다.' });
        }
        const [result] = await pool.query(`INSERT INTO issues
            (project_id, reporter_id, assigned_employee_id, issue_title, issue_description,
             issue_priority, issue_status, issue_due_date)
            VALUES (?, ?, ?, ?, ?, ?, '접수', ?)`,
            [Number(projectId), req.user.employee_id, assigneeId || null,
            title.trim(), String(description || ''), priority, due || null]);
        res.status(201).json({ id: result.insertId, message: '이슈 등록 완료' });
    } catch (error) {
        console.error('이슈 DB 등록 오류:', error);
        res.status(500).json({ message: '이슈 DB 등록 실패' });
    }
});

router.patch('/issues/:id', async (req, res) => {
    const id = Number(req.params.id);
    const fields = {
        title: 'issue_title', description: 'issue_description', priority: 'issue_priority',
        status: 'issue_status', assigneeId: 'assigned_employee_id',
        due: 'issue_due_date', projectId: 'project_id'
    };
    const values = req.body || {};
    const keys = Object.keys(values);
    if (!Number.isInteger(id) || id <= 0 || !keys.length || keys.some(k => !fields[k])) {
        return res.status(400).json({ message: '수정 항목 오류' });
    }
    if (values.priority !== undefined && !['낮음', '보통', '높음', '긴급'].includes(values.priority)) {
        return res.status(400).json({ message: '우선순위 오류' });
    }
    if (values.status !== undefined && !['접수', '진행 중', '검토 중', '완료', '재오픈'].includes(values.status)) {
        return res.status(400).json({ message: '이슈 상태 오류' });
    }
    if (values.title !== undefined && (typeof values.title !== 'string' || !values.title.trim())) {
        return res.status(400).json({ message: '제목을 입력하세요.' });
    }
    if (values.due && !/^\d{4}-\d{2}-\d{2}$/.test(values.due)) {
        return res.status(400).json({ message: '마감일 형식 오류' });
    }
    if (keys.some(k => ['title', 'description'].includes(k) &&
        (typeof values[k] !== 'string' || values[k].length > 2000))) {
        return res.status(400).json({ message: '입력 글자 수 오류' });
    }
    for (const key of ['assigneeId', 'projectId']) {
        if (values[key] != null && (!Number.isInteger(Number(values[key])) || Number(values[key]) <= 0)) {
            return res.status(400).json({ message: key + ' 값 오류' });
        }
    }
    try {
        if (values.assigneeId != null) {
            const [employees] = await pool.query('SELECT employee_id FROM employees WHERE employee_id = ?', [values.assigneeId]);
            if (!employees.length) return res.status(400).json({ message: '담당자가 존재하지 않습니다.' });
        }
        if (values.projectId != null) {
            const [projects] = await pool.query('SELECT project_id FROM projects WHERE project_id = ?', [values.projectId]);
            if (!projects.length) return res.status(400).json({ message: '프로젝트가 존재하지 않습니다.' });
        }
        const sets = keys.map(k => fields[k] + ' = ?');
        const params = keys.map(k => values[k] === '' ? null : values[k]);
        if (values.status === '완료') sets.push('issue_resolved_at = NOW()');
        if (values.status === '재오픈') sets.push('issue_resolved_at = NULL');
        const [result] = await pool.query('UPDATE issues SET ' + sets.join(', ') + ' WHERE issue_id = ?', [...params, id]);
        if (!result.affectedRows) return res.status(404).json({ message: '이슈가 없습니다.' });
        res.json({ message: '이슈 수정 완료' });
    } catch (error) {
        console.error('이슈 DB 수정 오류:', error);
        res.status(500).json({ message: '이슈 DB 수정 실패' });
    }
});

// 임시 저장: DB에 날짜를 기록하고, 복구 시 날짜를 비웁니다.
router.patch('/issues/:id/draft', async (req, res) => {
    const id = Number(req.params.id);
    const draft = req.body && req.body.draft;
    if (!Number.isInteger(id) || id <= 0 || typeof draft !== 'boolean') {
        return res.status(400).json({ message: '요청 값을 확인하세요.' });
    }
    try {
        const [result] = await pool.query(
            draft
                ? 'UPDATE issues SET nexus_draft_at = NOW(), nexus_draft_by = ? WHERE issue_id = ?'
                : 'UPDATE issues SET nexus_draft_at = NULL, nexus_draft_by = NULL WHERE issue_id = ?',
            draft ? [req.user.employee_id, id] : [id]
        );
        if (!result.affectedRows) return res.status(404).json({ message: '이슈가 없습니다.' });
        res.json({ message: draft ? '임시 저장 완료' : '복구 완료' });
    } catch (error) {
        console.error('임시 저장 오류:', error);
        res.status(500).json({ message: '임시 저장 변경 실패' });
    }
});

// 요청사항을 저장하고 메인 관리자 알림에 전달합니다.
router.get('/issues/:id/requests', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT r.request_id AS id, r.content, r.author_id AS authorId,
                   e.employee_name AS author,
                   DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i') AS createdAt
            FROM nexus_issue_requests r
            LEFT JOIN employees e ON e.employee_id = r.author_id
            WHERE r.issue_id = ? ORDER BY r.request_id DESC`, [req.params.id]);
        res.json({ requests: rows });
    } catch (error) {
        console.error('요청사항 조회 오류:', error);
        res.status(500).json({ message: '요청사항 조회 실패' });
    }
});

router.post('/issues/:id/requests', async (req, res) => {
    const issueId = Number(req.params.id);
    const content = String((req.body || {}).content || '').trim();
    if (!Number.isInteger(issueId) || issueId <= 0 || !content || content.length > 2000) {
        return res.status(400).json({ message: '요청사항을 1~2000자로 입력하세요.' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [issues] = await connection.query(
            'SELECT issue_title, assigned_employee_id FROM issues WHERE issue_id = ? FOR UPDATE', [issueId]
        );
        if (!issues.length) {
            await connection.rollback();
            return res.status(404).json({ message: '이슈가 없습니다.' });
        }
        await connection.query(
            'INSERT INTO nexus_issue_requests (issue_id, author_id, content) VALUES (?, ?, ?)',
            [issueId, req.user.employee_id, content]
        );
        // 관리자 메인 헤더의 기존 이슈 알림을 사용합니다.
        const [admins] = await connection.query(
            "SELECT employee_id FROM employees WHERE employee_role = '관리자' AND employee_status = '재직'"
        );
        const recipients = new Set(admins.map(a => a.employee_id));
        if (issues[0].assigned_employee_id) recipients.add(issues[0].assigned_employee_id);
        const message = '[요청사항] #' + issueId + ' ' + issues[0].issue_title + ': ' + content.slice(0, 100);
        for (const employeeId of recipients) {
            await connection.query(
                'INSERT INTO notifications (employee_id, type, message, link, is_read) VALUES (?, ?, ?, ?, 0)',
                [employeeId, '이슈', message, '/admin/issues']
            );
        }
        await connection.commit();
        res.status(201).json({ message: '요청사항 등록 및 알림 완료' });
    } catch (error) {
        await connection.rollback();
        console.error('요청사항 등록 오류:', error);
        res.status(500).json({ message: '요청사항 등록 실패' });
    } finally {
        connection.release();
    }
});

router.get("/issues/:id/work-logs", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT log_id AS id, issue_id AS issueId, employee_id AS employeeId, description, minutes, created_at AS createdAt FROM nexus_issue_work_logs WHERE issue_id = ? ORDER BY log_id DESC", [req.params.id]);
        res.json({ workLogs: rows });
    } catch (error) { console.error(error); res.status(500).json({ message: "작업일지 조회 실패. SQL 마이그레이션을 확인하세요." }); }
});
router.post("/issues/:id/work-logs", async (req, res) => {
    const { description, minutes } = req.body || {};
    if (!String(description || '').trim() || !Number.isInteger(minutes) || minutes <= 0 || minutes > 1440 || !Number.isInteger(Number(req.params.id))) return res.status(400).json({ message: "작업 내용과 시간을 확인하세요." });
    try {
        const [result] = await pool.query("INSERT INTO nexus_issue_work_logs (issue_id, employee_id, description, minutes) VALUES (?, ?, ?, ?)", [req.params.id, req.user.employee_id, String(description).trim(), minutes]);
        res.status(201).json({ id: result.insertId });
    } catch (error) { console.error(error); res.status(500).json({ message: "작업일지 저장 실패. SQL 마이그레이션을 확인하세요." }); }
});

module.exports = router;
