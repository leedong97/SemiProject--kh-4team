// 준우 폴더: 대시보드 일정 / 공지사항 / 프로젝트 API
// 주소 = prefix + 각 파일 안의 주소.  예) '/api/notices' + '/:id' => /api/notices/:id
module.exports = {
  routes: [
    { prefix: '/api/dashboard', router: require('./dashboard') },
    { prefix: '/api/notices', router: require('./notices') },
    { prefix: '/api/projects', router: require('./projects') },
  ],
};
