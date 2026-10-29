// 종호 폴더: 관리자 API (/api/admin/...)
// 프론트(종호 담당 /admin/...)가 쓰는 주소를 그대로 유지합니다.
// 로컬 개발용: 로그인 검사와 감사 로그를 쓰지 않습니다. 외부에 공개하는 환경에서는 쓰지 마세요.
const adminRouter = require('./admin');
const express = require('express');

// 로그인이 없으므로, 등록자(created_by) 같은 값에 쓸 기본 직원 번호를 넣습니다. (.env의 DEV_ADMIN_ID, 없으면 1)
const devAdminId = Number(process.env.DEV_ADMIN_ID) || 1;
const devRouter = express.Router();
devRouter.use((req, res, next) => {
  req.adminId = devAdminId;
  next();
});
devRouter.use(adminRouter);

module.exports = {
  routes: [{ prefix: '/api/admin', router: devRouter }],
};