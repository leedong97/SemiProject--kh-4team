// 희승 담당 API. 기존 다른 팀원 라우터는 수정하지 않습니다.
module.exports = {
    routes: [
        { prefix: "/api/hr", router: require("./hr") },
        { prefix: "/api/evaluations", router: require("./evaluations") },
        { prefix: "/api/management", router: require("./operations") }
    ]
};
