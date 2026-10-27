const express = require('express');
const pool = require('../../db');

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

// 이슈 목록 (대시보드·이슈 관리용)
// due 는 날짜 문자열(YYYY-MM-DD)로 맞춰서 화면의 날짜 비교가 그대로 동작하도록 합니다.
router.get('/issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT issue_id                       AS id,
             issue_title                    AS title,
             assigned_employee_id           AS assigneeId,
             issue_priority                 AS priority,
             issue_status                   AS status,
             DATE_FORMAT(issue_due_date, '%Y-%m-%d') AS due
      FROM issues
      ORDER BY issue_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 프로젝트 목록 (대시보드 진행 현황·담당자 배정용)
router.get('/projects', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT project_id       AS id,
             project_title    AS name,
             status           AS status,
             project_progress AS progress,
             manager_id       AS managerId
      FROM projects
      ORDER BY project_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
