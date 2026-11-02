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

// 프로젝트 목록 (고객사 이름은 customers 테이블과 JOIN)
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// ── 프로젝트 변경 API: MySQL에 실제 저장 ──
// 프로젝트 status는 현재 DB ENUM(예정/진행중/완료/보류)을 그대로 사용합니다.
function validId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}
router.post('/projects', async (req, res) => {
  const { name, customer, description, startDate, endDate, budget } = req.body;
  if (!name || !name.trim() || !customer || !customer.trim() || !description || !description.trim())
    return res.status(400).json({ message: '프로젝트명, 고객사, 설명을 입력하세요.' });
  if (startDate && endDate && startDate > endDate)
    return res.status(400).json({ message: '종료일을 확인하세요.' });
  if (budget !== undefined && (!Number.isSafeInteger(Number(budget)) || Number(budget) < 0))
    return res.status(400).json({ message: '예산이 올바르지 않습니다.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [customers] = await connection.query(
      'SELECT customer_id FROM customers WHERE customer_name = ? LIMIT 1',
      [customer.trim()]
    );
    if (!customers.length) {
      await connection.rollback();
      return res.status(400).json({ message: '등록된 고객사를 입력하세요.' });
    }
    const [result] = await connection.query(
      `INSERT INTO projects (project_title, project_content, created_by, customer_id, budget, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, '예정')`,
      [
        name.trim(),
        description.trim(),
        req.adminId,
        customers[0].customer_id,
        budget === '' ? null : (budget ?? null),
        startDate || null,
        endDate || null
      ]
    );
    await connection.commit();
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
  if (status !== undefined && !['예정', '진행중', '완료', '보류'].includes(status))
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
      const [customers] = await connection.query(
        'SELECT customer_id FROM customers WHERE customer_name = ? LIMIT 1',
        [customer.trim()]
      );
      if (!customers.length) {
        await connection.rollback();
        return res.status(400).json({ message: '등록된 고객사를 입력하세요.' });
      }
      fields.push('customer_id = ?');
      values.push(customers[0].customer_id);
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
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: '수정 실패: ' + error.message });
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
router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT log_id AS id, admin_id AS adminId, action, target_id AS targetId, created_at AS createdAt FROM admin_audit_logs ORDER BY log_id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: '감사 로그 조회에 실패했습니다.' });
  }
});