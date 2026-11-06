const express = require('express');
const pool = require('../../db');
const { createNotification } = require('../../notify');

const router = express.Router();

// 직원 평가 목록 (프론트가 쓰는 필드명으로 별칭 지정)
router.get('/evaluations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT ev.evaluation_id      AS id,
             ev.employee_id        AS employeeId,
             ev.evaluator_id       AS evaluatorId,
             ev.evaluation_period  AS period,
             ev.evaluation_score   AS score,
             ev.evaluation_comment AS feedback,
             ev.evaluation_status  AS status,
             ev.appeal,
             ev.employee_response  AS employeeResponse,
             e.employee_name       AS employeeName
      FROM employee_evaluations ev
      LEFT JOIN employees e ON ev.employee_id = e.employee_id
      ORDER BY ev.evaluation_id
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 직원 목록 (화면 필드명으로 매핑)
// 민감 정보(비밀번호, 급여, 전화번호, 주소, 입사일)는 조회하지 않습니다.
// 매핑: team←employee_team, position←employee_position(직무), rank←employee_grade(직급), role←employee_role
router.get('/employees', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT employee_id       AS id,
             employee_name     AS name,
             employee_team     AS team,
             employee_position AS position,
             employee_role     AS role,
             employee_grade    AS \`rank\`,
             employee_status   AS status
      FROM employees
      ORDER BY employee_id
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 재무 요약: 재직자 연봉 합계와 인원 수만 내려줍니다 (개인별 급여는 내려주지 않음)
router.get('/finance/summary', async (req, res) => {
    try {
        const [[row]] = await pool.query(`
      SELECT COUNT(*)                        AS headcount,
             COALESCE(SUM(employee_salary), 0) AS totalSalary
      FROM employees
      WHERE employee_status = '재직'
    `);
        res.json({ headcount: Number(row.headcount), totalSalary: Number(row.totalSalary) });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 이슈 목록 (대시보드·이슈 관리용)
// due 는 날짜 문자열(YYYY-MM-DD)로 맞춰서 화면의 날짜 비교가 그대로 동작하도록 합니다.
router.get('/issues', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT i.issue_id                       AS id,
             i.issue_title                    AS title,
             i.project_id                     AS projectId,
             p.project_title                  AS projectName,
             i.assigned_employee_id           AS assigneeId,
             i.reporter_id                    AS reporterId,
             i.issue_priority                 AS priority,
             i.issue_status                   AS status,
             i.issue_description              AS description,
             DATE_FORMAT(i.issue_created_at, '%Y-%m-%d %H:%i') AS createdAt,
             DATE_FORMAT(i.issue_due_date, '%Y-%m-%d') AS due
      FROM issues i
      LEFT JOIN projects p ON p.project_id = i.project_id
      ORDER BY i.issue_id
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 프로젝트 목록 (고객사 이름은 customers 테이블과 JOIN)

// 팀장 이상 직급만 담당자가 될 수 있습니다.
const LEADER_GRADES = ['팀장', '실장', '부장', '이사', '상무', '전무', '대표'];

// 주어진 직원 번호가 모두 재직 중인지 확인합니다.
async function allActiveEmployees(conn, ids) {
    if (!ids.length) return true;
    const [rows] = await conn.query(
        "SELECT employee_id FROM employees WHERE employee_status = '재직' AND employee_id IN (?)",
        [ids]
    );
    return rows.length === ids.length;
}

// 고객사 이름으로 번호를 찾는다 (없으면 null). 고객사는 목록에서 고른 것만 쓴다.
async function findCustomerId(conn, name) {
    const [rows] = await conn.query(
        'SELECT customer_id FROM customers WHERE customer_name = ? LIMIT 1',
        [name]
    );
    return rows.length ? rows[0].customer_id : null;
}

// 프로젝트 팀원 명단을 통째로 저장합니다. 담당자는 항상 팀원에 포함됩니다.
async function saveProjectMembers(conn, projectId, managerId, memberIds) {
    const ids = [...new Set([...(managerId ? [managerId] : []), ...memberIds])];
    await conn.query('DELETE FROM project_members WHERE project_id = ?', [projectId]);
    if (ids.length) {
        await conn.query(
            'INSERT INTO project_members (project_id, employee_id, role) VALUES ?',
            [ids.map((id) => [projectId, id, id === managerId ? '담당자' : '팀원'])]
        );
    }
}

// 프로젝트 알림: 여러 명에게 같은 문장을 보내요 (중복 제거, 실패해도 본 작업엔 영향 없음)
async function notifyProjectPeople(ids, message) {
    for (const id of new Set(ids.filter((v) => v != null).map(String))) {
        await createNotification(id, '프로젝트', message, null);
    }
}

// ===== 커뮤니티 관리 (게시글·댓글 목록과 삭제만 제공) =====
// 익명 글은 작성자를 '익명'으로만 보여준다 (실제 작성자는 노출하지 않음)

// 게시글 목록
router.get('/community/posts', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.id, p.board_name AS boardName, p.title, p.is_anonymous AS isAnonymous,
             e.employee_name AS authorName,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt,
             (SELECT COUNT(*) FROM community_comment c WHERE c.post_id = p.id AND c.is_deleted = 0) AS commentCount
      FROM community_post p
      LEFT JOIN employees e ON e.employee_id = p.author_id
      ORDER BY p.id DESC
      LIMIT 300
    `);
        res.json(rows.map((r) => ({
            ...r,
            authorName: r.isAnonymous ? '익명' : r.authorName,
        })));
    } catch (err) {
        res.status(500).json({ message: '게시글 목록을 불러오지 못했습니다.' });
    }
});

// 게시글 한 건 + 댓글
router.get('/community/posts/:id', async (req, res) => {
    const postId = Number(req.params.id);
    if (!validId(postId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
    try {
        const [posts] = await pool.query(`
      SELECT p.id, p.board_name AS boardName, p.title, p.content, p.is_anonymous AS isAnonymous,
             e.employee_name AS authorName,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_post p
      LEFT JOIN employees e ON e.employee_id = p.author_id
      WHERE p.id = ?
    `, [postId]);
        if (!posts.length) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
        const post = posts[0];
        post.authorName = post.isAnonymous ? '익명' : post.authorName;

        const [comments] = await pool.query(`
      SELECT c.id, c.content, c.is_deleted AS isDeleted, e.employee_name AS authorName,
             DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_comment c
      LEFT JOIN employees e ON e.employee_id = c.author_id
      WHERE c.post_id = ?
      ORDER BY c.id
    `, [postId]);
        res.json({ post, comments: comments.map((c) => ({ ...c, content: c.isDeleted ? '' : c.content })) });
    } catch (err) {
        res.status(500).json({ message: '게시글을 불러오지 못했습니다.' });
    }
});

// 게시글 삭제 (준우 쪽과 같이 실제로 지운다)
router.delete('/community/posts/:id', async (req, res) => {
    const postId = Number(req.params.id);
    if (!validId(postId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
    try {
        const [result] = await pool.query('DELETE FROM community_post WHERE id = ?', [postId]);
        if (result.affectedRows === 0) return res.status(404).json({ message: '삭제할 게시글이 없습니다.' });
        res.json({ message: '게시글을 삭제했습니다.' });
    } catch (err) {
        res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
    }
});

// 댓글 삭제 (준우 쪽과 같이 내용을 비우고 삭제 표시)
router.delete('/community/comments/:id', async (req, res) => {
    const commentId = Number(req.params.id);
    if (!validId(commentId)) return res.status(400).json({ message: '잘못된 댓글 번호입니다.' });
    try {
        const [result] = await pool.query(
            "UPDATE community_comment SET content = '', is_deleted = 1 WHERE id = ? AND is_deleted = 0",
            [commentId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: '삭제할 댓글이 없거나 이미 삭제되었습니다.' });
        res.json({ message: '댓글을 삭제했습니다.' });
    } catch (err) {
        res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
    }
});

// 고객사 목록 (등록·수정 화면의 선택지)
router.get('/customers', async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT customer_id AS id, customer_name AS name, customer_status AS status FROM customers ORDER BY customer_name"
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/projects', async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT p.project_id                          AS id,
             p.project_title                       AS name,
             c.customer_name                       AS customer,
             p.status                              AS status,
             p.project_progress                    AS progress,
             p.planned_progress                    AS plannedProgress,
             p.budget                              AS budget,
             DATE_FORMAT(p.start_date, '%Y-%m-%d') AS startDate,
             DATE_FORMAT(p.end_date,   '%Y-%m-%d') AS endDate,
             p.project_content                     AS description,
             p.manager_id                          AS managerId
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      ORDER BY p.project_id
    `);
        const [memberRows] = await pool.query('SELECT project_id AS projectId, employee_id AS employeeId FROM project_members');
        const byProject = new Map();
        memberRows.forEach((m) => {
            if (!byProject.has(m.projectId)) byProject.set(m.projectId, []);
            byProject.get(m.projectId).push(m.employeeId);
        });
        res.json(rows.map((r) => ({ ...r, memberIds: byProject.get(r.id) || [] })));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===== 요청 처리 (project_requests 테이블: 등록 + 완료 공용) =====
// 메인 페이지가 project_requests 에 요청을 넣고, 관리자가 여기서 승인 또는 반려합니다.
// request_type: '등록' (새 프로젝트) / '완료' (기존 프로젝트 완료)

const PROJECT_STATUS_LIST = ['예정', '진행중', '완료', '보류'];
const PROJECT_PRIORITY_LIST = ['낮음', '보통', '높음'];

// 요청 목록 (기본: 대기 중). type 으로 종류를 골라 볼 수 있음
router.get('/project-requests', async (req, res) => {
    const status = req.query.status || '대기';
    const type = req.query.type;
    if (!['대기', '승인', '반려'].includes(status)) {
        return res.status(400).json({ message: '잘못된 상태입니다.' });
    }
    if (type && !['등록', '완료'].includes(type)) {
        return res.status(400).json({ message: '잘못된 요청 종류입니다.' });
    }
    try {
        const params = [status];
        let typeFilter = '';
        if (type) {
            typeFilter = ' AND pr.request_type = ?';
            params.push(type);
        }
        const [rows] = await pool.query(
            `SELECT pr.request_id AS id,
              pr.request_type AS type,
              pr.title,
              pr.content,
              pr.project_id AS projectId,
              p.project_title AS projectName,
              pr.requested_by AS requesterId,
              e.employee_name AS requesterName,
              DATE_FORMAT(pr.start_date, '%Y-%m-%d') AS startDate,
              DATE_FORMAT(pr.end_date, '%Y-%m-%d') AS endDate,
              pr.project_status AS projectStatus,
              pr.priority,
              pr.reason,
              pr.reject_reason AS rejectReason,
              pr.request_status AS status,
              DATE_FORMAT(pr.created_at, '%Y-%m-%d %H:%i') AS requestedAt,
              pr.approved_project_id AS approvedProjectId
       FROM project_requests pr
       LEFT JOIN projects p ON pr.project_id = p.project_id
       LEFT JOIN employees e ON pr.requested_by = e.employee_id
       WHERE pr.request_status = ?${typeFilter}
       ORDER BY pr.request_id DESC`,
            params
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 요청 승인 (트랜잭션)
// - 등록: projects 에 새 프로젝트 생성 (담당자는 비움)
// - 완료: 대상 프로젝트를 완료, 실제 진행률 100
router.post('/project-requests/:id/approve', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: '잘못된 요청 번호입니다.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            `SELECT request_id, request_type, title, content, requested_by, project_id, request_status,
              project_status, priority,
              DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
       FROM project_requests WHERE request_id = ? FOR UPDATE`,
            [req.params.id]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
        }
        const request = rows[0];
        if (request.request_status !== '대기') {
            await connection.rollback();
            return res.status(400).json({ message: '이미 처리된 요청입니다.' });
        }

        let approvedProjectId;

        if (request.request_type === '등록') {
            if (request.start_date > request.end_date) {
                await connection.rollback();
                return res.status(400).json({ message: '종료일이 시작일보다 빠릅니다.' });
            }
            const status = PROJECT_STATUS_LIST.includes(request.project_status) ? request.project_status : '예정';
            const priority = PROJECT_PRIORITY_LIST.includes(request.priority) ? request.priority : '보통';
            const [inserted] = await connection.query(
                `INSERT INTO projects (project_title, project_content, created_by, manager_id, status, priority, start_date, end_date)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
                [request.title, request.content, request.requested_by, status, priority, request.start_date, request.end_date]
            );
            approvedProjectId = inserted.insertId;
        } else if (request.request_type === '완료') {
            const [result] = await connection.query(
                "UPDATE projects SET status = '완료', project_progress = 100 WHERE project_id = ?",
                [request.project_id]
            );
            if (!result.affectedRows) {
                await connection.rollback();
                return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
            }
            approvedProjectId = request.project_id;
        } else {
            await connection.rollback();
            return res.status(400).json({ message: '알 수 없는 요청 종류입니다.' });
        }

        await connection.query(
            `UPDATE project_requests
       SET request_status = '승인', processed_by = ?, processed_at = NOW(), approved_project_id = ?
       WHERE request_id = ?`,
            [req.adminId, approvedProjectId, request.request_id]
        );

        await connection.commit();

        // 알림: 요청을 올린 직원에게 승인 결과를 알려요 (알림 저장이 실패해도 승인 처리는 그대로 성공이에요)
        await createNotification(
            request.requested_by,
            '프로젝트',
            '신청한 프로젝트 ' + request.request_type + ' 요청(' + request.title + ')이 승인됐어요.',
            null
        );

        res.json({ ok: true, projectId: approvedProjectId });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: '요청 승인 실패: ' + err.message });
    } finally {
        connection.release();
    }
});

// 요청 반려: 반려 사유 필수, 대기 중인 요청만
router.post('/project-requests/:id/reject', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: '잘못된 요청 번호입니다.' });
    const rejectReason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!rejectReason) return res.status(400).json({ message: '반려 사유를 입력하세요.' });

    try {
        const [result] = await pool.query(
            `UPDATE project_requests
       SET request_status = '반려', reject_reason = ?, processed_by = ?, processed_at = NOW()
       WHERE request_id = ? AND request_status = '대기'`,
            [rejectReason, req.adminId, req.params.id]
        );
        if (!result.affectedRows) {
            return res.status(400).json({ message: '대기 중인 요청이 아니거나 없는 요청입니다.' });
        }

        // 알림: 요청을 올린 직원에게 반려 사유와 함께 알려요
        try {
            const [rejected] = await pool.query(
                'SELECT requested_by, request_type, title FROM project_requests WHERE request_id = ?',
                [req.params.id]
            );
            if (rejected[0]) {
                await createNotification(
                    rejected[0].requested_by,
                    '프로젝트',
                    '신청한 프로젝트 ' + rejected[0].request_type + ' 요청(' + rejected[0].title + ')이 반려됐어요. 사유: ' + rejectReason,
                    null
                );
            }
        } catch (notifyError) {
            console.error('프로젝트 반려 알림 오류:', notifyError.message);
        }

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: '요청 반려 실패: ' + err.message });
    }
});

module.exports = router;

// ── 프로젝트 변경 API: MySQL에 실제 저장 ──
// 프로젝트 status는 현재 DB ENUM(예정/진행중/완료/보류)을 그대로 사용합니다.
function validId(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
}
router.post('/projects', async (req, res) => {
    const { name, customer, description, startDate, endDate, budget, managerId, memberIds } = req.body;
    const managerNo = managerId === undefined || managerId === null || managerId === '' ? null : Number(managerId);
    const members = Array.isArray(memberIds) ? [...new Set(memberIds.map(Number))] : [];
    if (managerNo !== null && !validId(managerNo))
        return res.status(400).json({ message: '담당자 번호가 올바르지 않습니다.' });
    if (members.some((id) => !validId(id)))
        return res.status(400).json({ message: '팀원 번호가 올바르지 않습니다.' });
    if (!name || !name.trim() || !customer || !customer.trim() || !description || !description.trim())
        return res.status(400).json({ message: '프로젝트명, 고객사, 설명을 입력하세요.' });
    if (startDate && endDate && startDate > endDate)
        return res.status(400).json({ message: '종료일을 확인하세요.' });
    if (budget !== undefined && (!Number.isSafeInteger(Number(budget)) || Number(budget) < 0))
        return res.status(400).json({ message: '예산이 올바르지 않습니다.' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const customerId = await findCustomerId(connection, customer.trim());
        if (!customerId) {
            await connection.rollback();
            return res.status(400).json({ message: '등록된 고객사를 선택하세요.' });
        }
        if (managerNo !== null) {
            const [managers] = await connection.query(
                'SELECT employee_status, employee_grade FROM employees WHERE employee_id = ?',
                [managerNo]
            );
            if (!managers.length || managers[0].employee_status !== '재직' || !LEADER_GRADES.includes(managers[0].employee_grade)) {
                await connection.rollback();
                return res.status(400).json({ message: '담당자는 재직 중인 팀장 이상만 지정할 수 있습니다.' });
            }
        }
        if (!(await allActiveEmployees(connection, [...new Set([...(managerNo ? [managerNo] : []), ...members])]))) {
            await connection.rollback();
            return res.status(400).json({ message: '재직 중이 아닌 직원이 포함되어 있습니다.' });
        }
        const [result] = await connection.query(
            `INSERT INTO projects (project_title, project_content, created_by, customer_id, budget, start_date, end_date, status, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name.trim(),
                description.trim(),
                req.adminId,
                customerId,
                budget === '' ? null : (budget ?? null),
                startDate || null,
                endDate || null,
                managerNo !== null ? '진행중' : '예정',
                managerNo
            ]
        );
        await saveProjectMembers(connection, result.insertId, managerNo, members);
        await connection.commit();

        // 알림: 담당자와 팀원에게 새 프로젝트 배정을 알려요
        await notifyProjectPeople([managerNo], '"' + name + '" 프로젝트의 담당자로 배정됐어요.');
        await notifyProjectPeople(members.filter((id) => id !== managerNo), '"' + name + '" 프로젝트의 팀원으로 배정됐어요.');

        res.status(201).json({ id: result.insertId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: '프로젝트 등록 실패: ' + error.message });
    } finally {
        connection.release();
    }
});
router.patch('/projects/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: '잘못된 프로젝트 번호입니다.' });
    const {
        name,
        customer,
        description,
        startDate,
        endDate,
        budget,
        status,
        managerId,
        progress,
        plannedProgress
    } = req.body || {};

    if (name !== undefined && (typeof name !== 'string' || !name.trim()))
        return res.status(400).json({ message: '프로젝트명을 입력하세요.' });
    if (customer !== undefined && (typeof customer !== 'string' || !customer.trim()))
        return res.status(400).json({ message: '고객사를 입력하세요.' });
    if (description !== undefined && (typeof description !== 'string' || !description.trim()))
        return res.status(400).json({ message: '설명을 입력하세요.' });
    if (
        budget !== undefined &&
        budget !== null &&
        budget !== '' &&
        (!Number.isSafeInteger(Number(budget)) || Number(budget) < 0)
    )
        return res.status(400).json({ message: '예산이 올바르지 않습니다.' });
    if (status !== undefined && !['예정', '진행중', '완료 요청', '완료', '보류'].includes(status))
        return res.status(400).json({ message: '지원하지 않는 상태입니다.' });
    if (managerId !== undefined && managerId !== null && !validId(managerId))
        return res.status(400).json({ message: '담당자 번호가 올바르지 않습니다.' });
    if (
        progress !== undefined &&
        (!Number.isInteger(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)
    )
        return res.status(400).json({ message: '실제 진행률은 0~100 사이의 정수여야 합니다.' });
    if (
        plannedProgress !== undefined &&
        (!Number.isFinite(Number(plannedProgress)) ||
            Number(plannedProgress) < 0 ||
            Number(plannedProgress) > 100 ||
            Math.round(Number(plannedProgress) * 100) !== Number(plannedProgress) * 100)
    )
        return res
            .status(400)
            .json({ message: '계획 진행률은 0~100 사이의 숫자(소수 둘째 자리까지)여야 합니다.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            "SELECT status, manager_id, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date FROM projects WHERE project_id = ? FOR UPDATE",
            [req.params.id]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ message: '프로젝트가 없습니다.' });
        }
        if (rows[0].status === '완료' && managerId !== undefined) {
            await connection.rollback();
            return res.status(400).json({ message: '완료된 프로젝트는 담당자를 변경할 수 없습니다.' });
        }
        const previousManagerId = rows[0].manager_id;

        if (managerId != null) {
            const [managers] = await connection.query(
                'SELECT employee_grade, employee_status FROM employees WHERE employee_id = ?',
                [managerId]
            );
            if (
                !managers.length ||
                managers[0].employee_status !== '재직' ||
                !['팀장', '실장', '부장', '이사', '상무', '전무', '대표'].includes(managers[0].employee_grade)
            ) {
                await connection.rollback();
                return res.status(400).json({ message: '재직 중인 팀장 이상만 배정할 수 있습니다.' });
            }
        }

        // 기간 검증: 이번 요청으로 바뀌는 값과 기존 값을 합쳐서 확인
        const nextStart = startDate !== undefined ? startDate || null : rows[0].start_date;
        const nextEnd = endDate !== undefined ? endDate || null : rows[0].end_date;
        if (nextStart && nextEnd && nextStart > nextEnd) {
            await connection.rollback();
            return res.status(400).json({ message: '종료일을 확인하세요.' });
        }

        const fields = [];
        const values = [];
        if (name !== undefined) {
            fields.push('project_title = ?');
            values.push(name.trim());
        }
        if (description !== undefined) {
            fields.push('project_content = ?');
            values.push(description.trim());
        }
        if (customer !== undefined) {
            const customerId = await findCustomerId(connection, customer.trim());
            if (!customerId) {
                await connection.rollback();
                return res.status(400).json({ message: '등록된 고객사를 선택하세요.' });
            }
            fields.push('customer_id = ?');
            values.push(customerId);
        }
        if (budget !== undefined) {
            fields.push('budget = ?');
            values.push(budget === '' || budget === null ? null : Number(budget));
        }
        if (startDate !== undefined) {
            fields.push('start_date = ?');
            values.push(startDate || null);
        }
        if (endDate !== undefined) {
            fields.push('end_date = ?');
            values.push(endDate || null);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            values.push(status);
        }
        if (managerId !== undefined) {
            fields.push('manager_id = ?');
            values.push(managerId);
        }
        if (progress !== undefined) {
            fields.push('project_progress = ?');
            values.push(Number(progress));
        }
        if (plannedProgress !== undefined) {
            fields.push('planned_progress = ?');
            values.push(Number(plannedProgress));
        }

        if (!fields.length) {
            await connection.rollback();
            return res.status(400).json({ message: '변경 항목이 없습니다.' });
        }
        values.push(req.params.id);
        await connection.query('UPDATE projects SET ' + fields.join(', ') + ' WHERE project_id = ?', values);
        // 담당자가 바뀌거나 해제되면, 이전 담당자는 팀원 명단에서도 자동으로 빠진다.
        // (담당자로 자동 등록된 행(role='담당자')만 지운다. 직접 고른 팀원 행은 건드리지 않음)
        if (managerId !== undefined && previousManagerId != null && String(previousManagerId) !== String(managerId)) {
            await connection.query(
                "DELETE FROM project_members WHERE project_id = ? AND employee_id = ? AND role = '담당자'",
                [req.params.id, previousManagerId]
            );
        }
        if (managerId != null) {
            // 담당자로 지정된 사람은 팀원 명단에도 있어야 마이페이지·업무량에 보입니다.
            await connection.query(
                `INSERT INTO project_members (project_id, employee_id, role)
         SELECT ?, ?, '담당자' FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM project_members WHERE project_id = ? AND employee_id = ?)`,
                [req.params.id, managerId, req.params.id, managerId]
            );
        }
        await connection.commit();

        // 알림: 상태가 바뀌면 참여자 전체에게, 담당자가 바뀌면 새 담당자와 이전 담당자에게 알려요
        try {
            const [info] = await pool.query('SELECT project_title FROM projects WHERE project_id = ?', [req.params.id]);
            const projectTitle = info[0] ? info[0].project_title : '프로젝트';
            if (status !== undefined && status !== rows[0].status) {
                const [people] = await pool.query('SELECT employee_id FROM project_members WHERE project_id = ?', [req.params.id]);
                await notifyProjectPeople(
                    people.map((p) => p.employee_id),
                    '참여 중인 프로젝트 "' + projectTitle + '"의 상태가 ' + status + '(으)로 변경됐어요.'
                );
            }
            if (managerId !== undefined && String(previousManagerId) !== String(managerId)) {
                await notifyProjectPeople([managerId], '"' + projectTitle + '" 프로젝트의 담당자로 지정됐어요.');
                await notifyProjectPeople([previousManagerId], '"' + projectTitle + '" 프로젝트의 담당에서 해제됐어요.');
            }
        } catch (notifyError) {
            console.error('프로젝트 수정 알림 오류:', notifyError.message);
        }

        res.json({ ok: true });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: '수정 실패: ' + error.message });
    } finally {
        connection.release();
    }
});

// 프로젝트 팀원 배정 (명단 전체를 한 번에 저장)
router.put('/projects/:id/members', async (req, res) => {
    const projectId = Number(req.params.id);
    if (!validId(projectId)) return res.status(400).json({ message: '잘못된 프로젝트 번호입니다.' });
    const memberIds = Array.isArray(req.body && req.body.memberIds)
        ? [...new Set(req.body.memberIds.map(Number))]
        : null;
    if (!memberIds || memberIds.some((id) => !validId(id)))
        return res.status(400).json({ message: '팀원 목록을 확인하세요.' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [projects] = await connection.query(
            'SELECT status, manager_id FROM projects WHERE project_id = ? FOR UPDATE',
            [projectId]
        );
        if (!projects.length) {
            await connection.rollback();
            return res.status(404).json({ message: '프로젝트를 찾을 수 없습니다.' });
        }
        if (projects[0].status === '완료') {
            await connection.rollback();
            return res.status(400).json({ message: '완료된 프로젝트는 팀원을 변경할 수 없습니다.' });
        }
        if (!(await allActiveEmployees(connection, memberIds))) {
            await connection.rollback();
            return res.status(400).json({ message: '재직 중이 아닌 직원이 포함되어 있습니다.' });
        }
        const [beforeRows] = await connection.query('SELECT employee_id FROM project_members WHERE project_id = ?', [projectId]);
        await saveProjectMembers(connection, projectId, projects[0].manager_id, memberIds);
        await connection.commit();

        // 알림: 새로 배정된 사람과 빠진 사람에게만 알려요 (그대로인 사람은 제외)
        try {
            const beforeIds = beforeRows.map((r) => String(r.employee_id));
            const afterIds = [...new Set([...(projects[0].manager_id ? [projects[0].manager_id] : []), ...memberIds])].map(String);
            const [info] = await pool.query('SELECT project_title FROM projects WHERE project_id = ?', [projectId]);
            const projectTitle = info[0] ? info[0].project_title : '프로젝트';
            await notifyProjectPeople(afterIds.filter((id) => !beforeIds.includes(id)), '"' + projectTitle + '" 프로젝트의 팀원으로 배정됐어요.');
            await notifyProjectPeople(beforeIds.filter((id) => !afterIds.includes(id)), '"' + projectTitle + '" 프로젝트의 팀원에서 제외됐어요.');
        } catch (notifyError) {
            console.error('팀원 배정 알림 오류:', notifyError.message);
        }

        res.json({ message: '팀원 배정이 저장되었습니다.' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: '팀원 배정 실패: ' + error.message });
    } finally {
        connection.release();
    }
});

router.delete('/projects/:id', async (req, res) => {
    if (!validId(req.params.id)) return res.status(400).json({ message: '잘못된 프로젝트 번호입니다.' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // 연결된 이슈/업무가 있는 프로젝트는 DB 외래키 보호를 유지합니다.
        const [result] = await connection.query('DELETE FROM projects WHERE project_id = ?', [req.params.id]);
        if (!result.affectedRows) {
            await connection.rollback();
            return res.status(404).json({ message: '프로젝트가 없습니다.' });
        }
        await connection.commit();
        res.json({ ok: true });
    } catch (error) {
        await connection.rollback();
        res.status(409).json({ message: '관련 데이터가 있어 삭제할 수 없습니다. ' + error.message });
    } finally {
        connection.release();
    }
});
