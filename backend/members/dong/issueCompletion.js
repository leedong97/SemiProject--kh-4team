const express = require('express');
const db = require('../../db');
const { requireAuth, requireManager } = require('../../middleware/session');
const router = express.Router();
router.use(requireAuth);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const validId = value => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const participant = `EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id=i.project_id AND pm.employee_id=?)
  OR p.manager_id=? OR i.assigned_employee_id=?`;
const selectRequests = `SELECT r.id, r.issue_id AS issueId, r.requester_id AS requesterId,
  r.resolution, r.status, r.review_comment AS reviewComment, r.created_at AS createdAt,
  r.reviewed_at AS reviewedAt, i.issue_title AS title, p.project_title AS projectName,
  e.employee_name AS requesterName, reviewer.employee_name AS reviewerName
  FROM issue_completion_requests r JOIN issues i ON i.issue_id=r.issue_id
  JOIN projects p ON p.project_id=i.project_id JOIN employees e ON e.employee_id=r.requester_id
  LEFT JOIN employees reviewer ON reviewer.employee_id=r.reviewer_id`;

router.get('/completion-context', async (req, res, next) => {
  try {
    const employeeId = req.user.employee_id;
    const [issues] = await db.query(`SELECT i.issue_id AS id, i.issue_title AS title,
      i.issue_status AS status, p.project_title AS projectName,
      EXISTS (SELECT 1 FROM issue_completion_requests r WHERE r.issue_id=i.issue_id AND r.status='대기') AS pending
      FROM issues i JOIN projects p ON p.project_id=i.project_id
      WHERE (${participant}) AND i.issue_status <> '완료' ORDER BY i.issue_id DESC`,
    [employeeId, employeeId, employeeId]);
    const [requests] = await db.query(selectRequests + ' WHERE r.requester_id=? ORDER BY r.id DESC', [employeeId]);
    res.json({ issues, requests });
  } catch (error) { next(error); }
});
router.get('/issue-completion-requests', requireManager, async (req, res, next) => {
  try {
    const [rows] = await db.query(selectRequests + " ORDER BY (r.status='대기') DESC, r.id DESC");
    res.json(rows);
  } catch (error) { next(error); }
});
router.post('/issue-completion-requests', async (req, res, next) => {
  const { issueId, resolution } = req.body || {};
  if (!validId(issueId) || typeof resolution !== 'string' || !resolution.trim() || resolution.trim().length > 5000) {
    return res.status(400).json({ message: '이슈와 처리 내용(1~5000자)을 확인해주세요.' });
  }
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    // 동일 이슈의 요청과 검토는 이슈 행 잠금으로 직렬화합니다.
    const [issues] = await connection.query('SELECT * FROM issues WHERE issue_id=? FOR UPDATE', [issueId]);
    if (!issues.length) fail(404, '이슈를 찾을 수 없습니다.');
    if (issues[0].issue_status === '완료') fail(409, '이미 완료된 이슈입니다.');
    const employeeId = req.user.employee_id;
    const [allowed] = await connection.query(`SELECT i.issue_id FROM issues i JOIN projects p ON p.project_id=i.project_id
      WHERE i.issue_id=? AND (${participant})`, [issueId, employeeId, employeeId, employeeId]);
    if (!allowed.length) fail(403, '참여 프로젝트의 팀원, PM 또는 이슈 담당자만 완료를 요청할 수 있습니다.');
    const [pending] = await connection.query("SELECT id FROM issue_completion_requests WHERE issue_id=? AND status='대기' FOR UPDATE", [issueId]);
    if (pending.length) fail(409, '이미 검토 대기 중인 완료 요청이 있습니다.');
    const [result] = await connection.query('INSERT INTO issue_completion_requests (issue_id, requester_id, resolution) VALUES (?, ?, ?)', [issueId, employeeId, resolution.trim()]);
    await connection.commit();
    res.status(201).json({ id: result.insertId, message: '이슈 완료 요청을 등록했습니다.' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
});
router.patch('/issue-completion-requests/:id', requireManager, async (req, res, next) => {
  const { decision, comment = '' } = req.body || {};
  if (!validId(req.params.id) || !['승인', '반려'].includes(decision) || typeof comment !== 'string' || comment.trim().length > 2000 || (decision === '반려' && !comment.trim())) {
    return res.status(400).json({ message: '처리 결과를 확인하고 반려 시 사유(최대 2000자)를 입력해주세요.' });
  }
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [found] = await connection.query('SELECT issue_id FROM issue_completion_requests WHERE id=?', [req.params.id]);
    if (!found.length) fail(404, '완료 요청을 찾을 수 없습니다.');
    const [issues] = await connection.query('SELECT * FROM issues WHERE issue_id=? FOR UPDATE', [found[0].issue_id]);
    if (!issues.length) fail(404, '이슈를 찾을 수 없습니다.');
    const [rows] = await connection.query('SELECT * FROM issue_completion_requests WHERE id=? FOR UPDATE', [req.params.id]);
    const request = rows[0];
    if (!request || request.status !== '대기') fail(409, '이미 처리된 요청입니다.');
    if (decision === '승인') {
      if (issues[0].issue_status === '완료') fail(409, '이미 완료된 이슈입니다. 요청을 반려해주세요.');
      await connection.query("UPDATE issues SET issue_status='완료', issue_resolved_at=NOW(), issue_updated_at=NOW() WHERE issue_id=?", [request.issue_id]);
    }
    await connection.query('UPDATE issue_completion_requests SET status=?, review_comment=?, reviewer_id=?, reviewed_at=NOW() WHERE id=?', [decision, comment.trim(), req.user.employee_id, request.id]);
    await connection.commit();
    res.json({ issueId: request.issue_id, issueStatus: decision === '승인' ? '완료' : issues[0].issue_status, message: decision + ' 처리했습니다.' });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
});
router.use((error, req, res, next) => {
  console.error('이슈 완료 요청 오류:', error.code || '', error.message);
  res.status(error.status || 500).json({ message: error.status ? error.message : '완료 요청 처리에 실패했습니다. 서버와 DB 설정을 확인해주세요.' });
});
module.exports = router;
