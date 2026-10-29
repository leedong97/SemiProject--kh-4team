// 동협 폴더: 이슈관리용 API
// 동협 원본은 '/api/projects' 였는데 준우의 '/api/projects' 와 주소가 겹쳐서
// '/api/dong/projects' 로 옮겼어요. (프론트 DongContext.js 도 같이 바뀜)
const express = require('express');
const db = require('../../db');

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

module.exports = {
  routes: [{ prefix: '/api/dong', router }],
};
