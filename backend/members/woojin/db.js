// 우진 폴더의 routes 가 require("../db") 로 부르던 DB 풀.
// 메인 서버가 하나의 풀(backend/db.js)을 같이 쓰도록 그대로 내보내기만 합니다.
// (.env 는 메인 서버가 맨 처음에 읽어요)
module.exports = require('../../db');
