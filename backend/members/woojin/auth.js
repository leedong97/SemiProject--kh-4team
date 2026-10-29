const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../../db');
const { sign } = require('../../adminSecurity');

const router = express.Router();
const SALT_ROUNDS = 10;

// 회원가입
// 프론트 요청: { name, email, password }
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: '이름, 이메일, 비밀번호를 모두 입력하세요' });
  }

  try {
    // 비밀번호는 평문이 아니라 해시로 저장 (DDL 주석: 비밀번호 해시(평문 저장 금지))
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      `INSERT INTO employees (employee_name, employee_email, employee_pw)
       VALUES (?, ?, ?)`,
      [name, email, hashed]
    );

    return res.json({ result: 'success', employeeId: result.insertId });
  } catch (err) {
    // employee_email 은 UNIQUE → 중복 가입 시 ER_DUP_ENTRY
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 가입된 이메일입니다' });
    }
    return res.status(500).json({ message: '서버 요청 처리에 실패했습니다.' });
  }
});

// 로그인
// 프론트 요청: { email, password }
// 성공: { result: 'success', id, name, email }  실패: 'fail'
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT employee_id, employee_name, employee_email, employee_pw, employee_status, employee_role
       FROM employees
       WHERE employee_email = ?`,
      [email]
    );

    if (rows.length !== 1) {
      return res.json('fail');
    }

    const user = rows[0];

    // 퇴사 처리된 계정은 로그인 불가
    if (user.employee_status === '퇴사') {
      return res.json('fail');
    }

    const match = await bcrypt.compare(password, user.employee_pw);
    if (!match) {
      return res.json('fail');
    }

    return res.json({
      result: 'success',
      id: user.employee_id,
      name: user.employee_name,
      email: user.employee_email,
      role: user.employee_role,
      token: sign(user),
    });
  } catch (err) {
    return res.status(500).json({ message: '서버 요청 처리에 실패했습니다.' });
  }
});

// 탈퇴
// 주의: employees 는 issues, evaluations 등이 참조하므로 물리 삭제하지 않고 '퇴사' 처리
router.post('/withdraw', require('../../adminSecurity').requireAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '이메일을 입력하세요' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE employees SET employee_status = '퇴사' WHERE employee_email = ?`,
      [email]
    );
    return res.json(result.affectedRows > 0 ? 'success' : 'fail');
  } catch (err) {
    return res.status(500).json({ message: '서버 요청 처리에 실패했습니다.' });
  }
});

module.exports = router;
