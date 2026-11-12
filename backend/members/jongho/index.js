// 종호 폴더: 관리자 API (/api/admin/...)
// 프론트(종호 담당 /admin/...)가 쓰는 주소를 그대로 유지합니다.
// 모든 관리자 API는 로그인(토큰 검사)과 관리자 권한 검사를 거칩니다. (middleware/session.js)
const adminRouter = require('./admin');
const express = require('express');
const { requireAuth, requireManager } = require('../../middleware/session');

const adminGuardRouter = express.Router();

// 1) 로그인한 직원인지 확인 (Authorization: Bearer 토큰)
// 2) 관리자 계정인지 확인
// EventSource 는 헤더를 붙일 수 없어서, 실시간 견적 주소에 한해 ?token= 을 Authorization 으로 옮긴다
adminGuardRouter.use((req, res, next) => {
  if (req.path === '/quote-requests/events' && req.query.token && !req.headers.authorization) {
    req.headers.authorization = 'Bearer ' + req.query.token;
  }
  next();
});

adminGuardRouter.use(requireAuth, requireManager);

// 등록자(created_by) 등에 쓰는 번호는 고정값이 아니라 로그인한 관리자 번호
adminGuardRouter.use((req, res, next) => {
  req.adminId = req.user.employee_id;
  next();
});

adminGuardRouter.use(adminRouter);

module.exports = {
  routes: [{ prefix: '/api/admin', router: adminGuardRouter }],
};