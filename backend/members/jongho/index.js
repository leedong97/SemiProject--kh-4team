// 종호 폴더: 관리자 API (/api/admin/...)
// 프론트(종호 담당 /admin/...)가 쓰는 주소를 그대로 유지합니다.
const adminRouter = require('./admin');

module.exports = {
  routes: [{ prefix: '/api/admin', router: adminRouter }],
};
