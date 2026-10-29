// 공지사항 API 라우터를 서버에 전달합니다.
const noticesRouter = require("./notices");

module.exports = {
    routes: [
        {
            prefix: "/api/notices",
            router: noticesRouter
        }
    ]
};
