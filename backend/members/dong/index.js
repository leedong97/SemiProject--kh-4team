// 동협 폴더: 이슈관리용 API
// 동협 원본은 '/api/projects' 였는데 준우의 '/api/projects' 와 주소가 겹쳐서
// '/api/dong/projects' 로 옮겼어요. (프론트 DongContext.js 도 같이 바뀜)
const express = require('express');
const db = require('../../db');
const { createNotification } = require('../../notify');

const router = express.Router();

// GET /api/dong/projects  -> [{ id, name, customerName }]
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.project_id    AS id,
        p.project_title AS name,
        c.customer_name AS customerName
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      ORDER BY p.project_id
    `);
    res.json(rows);
  } catch (err) {
    console.error('프로젝트 조회 실패:', err);
    res.status(500).json({ message: '프로젝트 조회 실패' });
  }
});

// GET /api/dong/issues
router.get('/issues', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.issue_id          AS id,
        i.project_id        AS projectId,
        i.issue_title       AS title,
        i.issue_description AS description,
        i.issue_priority    AS priority,
        i.issue_status      AS status,
        i.issue_created_at  AS createdAt,
        e.employee_id       AS reporterId,
        e.employee_name     AS reporterName,
        e.employee_grade    AS reporterGrade,
        e.employee_phone    AS reporterPhone,
        p.project_title     AS projectName,
        c.customer_name     AS customerName
      FROM issues i
      LEFT JOIN employees e ON i.reporter_id = e.employee_id
      LEFT JOIN projects  p ON i.project_id  = p.project_id
      LEFT JOIN customers c ON p.customer_id = c.customer_id
      ORDER BY i.issue_id
    `);
    res.json(rows);
  } catch (err) {
    console.error('이슈 조회 실패:', err);
    res.status(500).json({ message: '이슈 조회 실패' });
  }
});

// POST /api/dong/issues — 이슈 건의 등록
router.post('/issues', async (req, res) => {
  const body = req.body ?? {};

  const projectId = Number(body.projectId);
  const title =
    typeof body.title === 'string' ? body.title.trim() : '';
  const description =
    typeof body.description === 'string'
      ? body.description.trim()
      : '';
  const reporterCode =
    typeof body.reporterCode === 'string'
      ? body.reporterCode.trim()
      : '';
  const reporterName =
    typeof body.reporterName === 'string'
      ? body.reporterName.trim()
      : '';
  const priority = body.priority ?? '보통';

  // 프론트 검증과 별개로 서버에서도 검사
  if (
    !Number.isInteger(projectId) ||
    projectId <= 0 ||
    !title ||
    !description ||
    !reporterCode ||
    !reporterName
  ) {
    return res.status(400).json({
      message: '프로젝트, 제목, 내용, 건의자 이름과 사원코드를 확인해주세요.'
    });
  }

  if (Array.from(title).length > 200) {
    return res.status(400).json({
      message: '이슈 제목은 200자 이하로 입력해주세요.'
    });
  }

  if (!['낮음', '보통', '높음', '긴급'].includes(priority)) {
    return res.status(400).json({
      message: '올바른 우선도를 선택해주세요.'
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 실제 존재하는 프로젝트인지 확인
    const [projects] = await connection.execute(
      'SELECT project_id FROM projects WHERE project_id = ?',
      [projectId]
    );

    if (projects.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: '존재하지 않는 프로젝트입니다.'
      });
    }

    // 입력한 사원코드로 실제 직원 조회
    const [employees] = await connection.execute(
      `SELECT employee_id, employee_name
       FROM employees
       WHERE employee_code = ?`,
      [reporterCode]
    );

    if (
      employees.length !== 1 ||
      employees[0].employee_name !== reporterName
    ) {
      await connection.rollback();

      return res.status(400).json({
        message: '건의자 이름과 사원코드가 직원 정보와 일치하지 않습니다.'
      });
    }

    // 선택한 프로젝트에 실제 참여한 직원만 건의할 수 있습니다.
    const [memberships] = await connection.execute(
      `SELECT 1 FROM project_members
       WHERE project_id = ? AND employee_id = ? LIMIT 1`,
      [projectId, employees[0].employee_id]
    );

    if (memberships.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        message: '본인이 참여하는 프로젝트에만 이슈를 건의할 수 있습니다.'
      });
    }

    // ID와 등록일은 DB가 생성하고, 상태는 서버에서 결정
    const [result] = await connection.execute(
      `INSERT INTO issues (
         project_id,
         reporter_id,
         assigned_employee_id,
         issue_title,
         issue_description,
         issue_priority,
         issue_status
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        employees[0].employee_id,
        // 건의한 직원을 이슈 담당자로 자동 배정합니다.
        employees[0].employee_id,
        title,
        description,
        priority,
        '검토 중'
      ]
    );

    // 목록 조회 API와 같은 형태로 저장 결과 반환
    const [rows] = await connection.execute(
      `SELECT
         i.issue_id          AS id,
         i.project_id        AS projectId,
         i.issue_title       AS title,
         i.issue_description AS description,
         i.issue_priority    AS priority,
         i.issue_status      AS status,
         i.issue_created_at  AS createdAt,
         e.employee_id       AS reporterId,
         e.employee_name     AS reporterName,
         e.employee_grade    AS reporterGrade,
         e.employee_phone    AS reporterPhone,
         p.project_title     AS projectName,
         c.customer_name     AS customerName
       FROM issues i
       LEFT JOIN employees e ON i.reporter_id = e.employee_id
       LEFT JOIN projects p ON i.project_id = p.project_id
       LEFT JOIN customers c ON p.customer_id = c.customer_id
       WHERE i.issue_id = ?`,
      [result.insertId]
    );

    await connection.commit();

    // 알림: 프로젝트 담당자(PM)에게 새 이슈 건의를 알려요 (담당자가 없거나 본인이면 건너뜀)
    try {
      const [owner] = await db.query(
        'SELECT manager_id FROM projects WHERE project_id = ?',
        [projectId]
      );
      const managerId = owner[0] && owner[0].manager_id;
      if (managerId && String(managerId) !== String(employees[0].employee_id)) {
        await createNotification(
          managerId,
          '이슈',
          employees[0].employee_name + '님이 새 이슈 "' + title + '"를 건의했어요.',
          '/issue/' + result.insertId
        );
      }
    } catch (notifyError) {
      console.error('이슈 건의 알림 오류:', notifyError.message);
    }

    return res.status(201).json(rows[0]);
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error('이슈 등록 실패:', err);

    return res.status(500).json({
      message: '이슈 등록에 실패했습니다.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
router.use(require('./issueCompletion'));
module.exports = {
  routes: [{ prefix: '/api/dong', router }],
};
