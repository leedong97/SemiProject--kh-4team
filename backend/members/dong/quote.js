const express = require('express');
const crypto = require('crypto');
const db = require('../../db');
const { requireShopAuth } = require('../../middleware/shopSession');
const { createNotificationForManagers } = require('../../notify');
const quoteBus = require('../../notifyBus');
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
    const connection = await db.getConnection();
    let result;

    try {
      await connection.beginTransaction();

      const [customers] = await connection.execute(
        'SELECT customer_id FROM customers WHERE customer_name = ? LIMIT 1',
        [company]
      );

      if (customers.length === 0) {
        // 기존 프로젝트 등록 코드와 같은 고객 코드 생성 규칙
        const customerCode = 'AUTO' + crypto
          .createHash('sha256')
          .update(company.toLowerCase())
          .digest('hex')
          .slice(0, 16)
          .toUpperCase();

        try {
          await connection.execute(
            `INSERT INTO customers (customer_code, customer_name)
             VALUES (?, ?)`,
            [customerCode, company]
          );
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') throw error;

          // 동시에 같은 고객사가 등록됐다면 기존 고객 사용
          const [existing] = await connection.execute(
            `SELECT customer_id
             FROM customers
             WHERE customer_name = ?
             LIMIT 1 FOR UPDATE`,
            [company]
          );

          if (existing.length === 0) throw error;
        }
      }

      [result] = await connection.execute(
        `INSERT INTO shop_quote_requests
         (member_id, service_name, company_name, contact_email, budget, requirements)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.member.member_id, service, company, email, budget, requirements]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  const notificationLink = `/admin/projects?quoteId=${result.insertId}`;
  await createNotificationForManagers(
    '견적 요청',
     `${company}의 ${service} 견적 문의가 접수되었습니다.`,
     notificationLink
      );
    quoteBus.emit('quote-changed');

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