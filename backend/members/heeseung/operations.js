const express = require("express");
const pool = require("../../db");
const { requireAuth, requireManager } = require("../../middleware/session");
const { createNotification } = require("../../notify");
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
        const [rows] = await pool.query(`
            SELECT
                i.issue_id AS id,
                i.project_id AS projectId,
                i.issue_title AS title,
                i.issue_description AS description,
                i.issue_status AS status,
                i.issue_priority AS priority,
                i.assigned_employee_id AS assigneeId,
                i.reporter_id AS reporterId,
                reporter.employee_name AS reporterName,
                e.employee_name AS assigneeName,
                DATE_FORMAT(i.issue_due_date, '%Y-%m-%d') AS due,
                DATE_FORMAT(i.issue_created_at, '%Y-%m-%d') AS createdAt,
                DATE_FORMAT(i.issue_resolved_at, '%Y-%m-%d') AS resolvedAt,
                p.project_title AS projectName,
                c.customer_name AS customerName,
                DATE_FORMAT(p.end_date, '%Y-%m-%d') AS projectEndDate
            FROM issues i
            LEFT JOIN employees e
                ON i.assigned_employee_id = e.employee_id
            LEFT JOIN employees reporter
                ON i.reporter_id = reporter.employee_id
            LEFT JOIN projects p
                ON p.project_id = i.project_id
            LEFT JOIN customers c
                ON c.customer_id = p.customer_id
            ORDER BY i.issue_id DESC
        `);

        res.json(rows);
    } catch (error) {
        console.error('이슈 DB 조회 오류:', error);
        res.status(500).json({
            message: '이슈 DB 조회 실패'
        });
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
        // 건의자는 요청 본문의 선택값이 아닌 인증된 로그인 직원으로 고정합니다.
        const reporterId = Number(req.user && req.user.employee_id);
        if (!Number.isInteger(reporterId) || reporterId <= 0) {
            return res.status(401).json({ message: '로그인 직원 정보를 확인할 수 없습니다.' });
        }
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
            [Number(projectId), reporterId, assigneeId || null,
            title.trim(), String(description || ''), priority, due || null]);
        // 알림: 담당자로 지정된 직원에게 알려요 (회의 결정: 본인이 본인을 지정해도 알림을 받아요)
        if (assigneeId != null) {
            await createNotification(assigneeId, '이슈', '새 이슈 "' + title.trim() + '"의 담당자로 지정됐어요.', '/issue/' + result.insertId);
        }
        // 새 이슈 등록 후 연결된 사용자 화면의 목록 갱신
        for (const client of req.app.locals.issueEventClients || []) {
            try {
                client.write('data: changed\n\n');
            } catch (_) {
                // 끊어진 연결은 SSE close 처리에서 제거됩니다.
            }
        }
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
        const [beforeIssue] = await pool.query(
            'SELECT reporter_id, assigned_employee_id, issue_title, issue_status FROM issues WHERE issue_id = ?', [id]);
        const sets = keys.map(k => fields[k] + ' = ?');
        const params = keys.map(k => values[k] === '' ? null : values[k]);
        if (values.status === '완료') sets.push('issue_resolved_at = NOW()');
        if (values.status === '재오픈') sets.push('issue_resolved_at = NULL');
        if (!beforeIssue.length) {
            return res.status(404).json({ message: '이슈가 없습니다.' });
        }

        let condition = '';
        const conditionParams = [];

        if (values.status !== undefined) {
            // 마감일도 함께 수정하면 이번에 입력한 날짜로 판단합니다.
            const hasDuePatch = keys.includes('due');
            const dueExpression = hasDuePatch ? '?' : 'issue_due_date';

            condition = ` AND (issue_status = ? OR ${dueExpression} IS NOT NULL)`;
            conditionParams.push(values.status);

            if (hasDuePatch) {
                conditionParams.push(values.due || null);
            }
        }

        const [result] = await pool.query(
            'UPDATE issues SET ' + sets.join(', ') +
            ' WHERE issue_id = ?' + condition,
            [...params, id, ...conditionParams]
        );

        if (!result.affectedRows) {
            return res.status(400).json({
                message: '마감일을 먼저 입력해야 처리 상태를 변경할 수 있습니다.'
            });
        }
        // 알림: 상태가 바뀌면 등록자와 담당자에게, 담당자가 바뀌면 새 담당자에게 알려요 (처리한 본인은 제외)
        const before = beforeIssue[0];

        if (before && values.status !== undefined &&
            values.status !== before.issue_status) {
            for (const client of req.app.locals.issueEventClients || []) {
                try {
                    client.write('data: changed\n\n');
                } catch (_) {
                    // 연결이 끊긴 클라이언트는 SSE 연결의 close 처리에서 제거됩니다.
                }
            }
        }

        if (before) {
            const link = '/issue/' + id;
            if (values.status !== undefined && values.status !== before.issue_status) {
                // 회의 결정: 상태를 바꾼 본인도 보고자/담당자이면 알림을 받아요 (Set 으로 같은 사람은 한 번만)
                const targets = [...new Set([before.reporter_id, before.assigned_employee_id].filter(v => v != null).map(String))];
                for (const target of targets) {
                    await createNotification(target, '이슈', '이슈 "' + before.issue_title + '"의 상태가 ' + values.status + '(으)로 바뀌었어요.', link);
                }
            }
            if (values.assigneeId != null && String(values.assigneeId) !== String(before.assigned_employee_id)) {
                await createNotification(values.assigneeId, '이슈', '이슈 "' + before.issue_title + '"의 담당자로 지정됐어요.', link);
            }
        }
        res.json({ message: '이슈 수정 완료' });
    } catch (error) {
        console.error('이슈 DB 수정 오류:', error);
        res.status(500).json({ message: '이슈 DB 수정 실패' });
    }
});

// 이슈별 요청사항 코멘트 조회: DB에 저장된 댓글을 오래된 순서로 표시합니다.
router.get('/issues/:id/comments', async (req, res) => {
    const issueId = Number(req.params.id);
    if (!Number.isInteger(issueId) || issueId <= 0) return res.status(400).json({ message: '이슈 번호 오류' });
    try {
        const [rows] = await pool.query(`
            SELECT c.comment_id AS id, c.issue_id AS issueId,
                   c.employee_id AS authorId, e.employee_name AS author,
                   c.content,
                   DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS createdAt
            FROM nexus_issue_comments c
            JOIN employees e ON e.employee_id = c.employee_id
            WHERE c.issue_id = ?
            ORDER BY c.created_at ASC, c.comment_id ASC`, [issueId]);
        res.json(rows);
    } catch (error) {
        console.error('이슈 코멘트 조회 오류:', error);
        res.status(500).json({ message: '코멘트 조회 실패. SQL 설치 여부를 확인하세요.' });
    }
});

// 댓글 작성자는 브라우저 입력값이 아닌 로그인 토큰에서 확인합니다.
router.post('/issues/:id/comments', async (req, res) => {
    const issueId = Number(req.params.id);
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!Number.isInteger(issueId) || issueId <= 0 || !content || content.length > 2000) {
        return res.status(400).json({ message: '이슈 번호와 코멘트 내용(2000자 이하)을 확인하세요.' });
    }
    try {
        const [issues] = await pool.query(
            'SELECT issue_title, assigned_employee_id FROM issues WHERE issue_id = ?', [issueId]);
        if (!issues.length) return res.status(404).json({ message: '해당 이슈가 없습니다.' });
        const [result] = await pool.query(
            'INSERT INTO nexus_issue_comments (issue_id, employee_id, content) VALUES (?, ?, ?)',
            [issueId, req.user.employee_id, content]);
        // 회의 결정: 본인이 담당자인 이슈에 본인이 코멘트를 남겨도 알림을 받아요.
        const assigneeId = issues[0].assigned_employee_id;
        if (assigneeId) {
            const [authors] = await pool.query('SELECT employee_name FROM employees WHERE employee_id = ?', [req.user.employee_id]);
            const authorName = authors[0]?.employee_name || '직원';
            await createNotification(assigneeId, '이슈',
                authorName + '님이 이슈 "' + issues[0].issue_title + '"에 요청사항 코멘트를 남겼어요.',
                '/issue/' + issueId);
        }
        res.status(201).json({ id: result.insertId, message: '코멘트 등록 완료' });
    } catch (error) {
        console.error('이슈 코멘트 등록 오류:', error);
        res.status(500).json({ message: '코멘트 등록 실패. SQL 설치 여부를 확인하세요.' });
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
