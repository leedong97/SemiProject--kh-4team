const express = require('express');
const db = require('../../db');
const { requireShopAuth } = require('../../middleware/shopSession');
const router = express.Router();

const budgets = [
  '',
  '100만원 미만',
  '100~300만원',
  '300~500만원',
  '500만원 이상',
  '별도 협의',
];

router.post('/quotes', requireShopAuth, async (req, res) => {
  const body = req.body ?? {};
  const read = (key) =>
    typeof body[key] === 'string' ? body[key].trim() : '';

  const service = read('service');
  const company = read('company');
  const email = read('email');
  const budget = read('budget');
  const requirements = read('requirements');

  if (
    !service || service.length > 150 ||
    !company || company.length > 100 ||
    !email || email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !requirements || requirements.length > 5000 ||
    !budgets.includes(budget)
  ) {
    return res.status(400).json({
      message:
        '서비스, 기업명(100자 이하), 이메일, 예산, 요구사항(5,000자 이하)을 확인해주세요.',
    });
  }

  try {
    const [result] = await db.execute(
        `INSERT INTO shop_quote_requests
        (member_id, service_name, company_name, contact_email, budget, requirements)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [req.member.member_id, service, company, email, budget, requirements]
    );

    return res.status(201).json({
      id: result.insertId,
      message: '견적 신청이 접수되었습니다.',
    });
  } catch (error) {
    console.error('견적 신청 저장 실패:', error.code);
    return res.status(500).json({
      message: '견적 신청 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

module.exports = router;