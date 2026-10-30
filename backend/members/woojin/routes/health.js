// ===== 서버 상태 확인 (GET /api/health) =====
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();
const pool = require("../db");

// GET 방식으로 /api/health 요청이 오면 실행되는 서버 상태 확인용 주소.
// async: 함수 안에서 await(DB 결과 기다리기)를 쓰겠다는 선언.
// req: 요청 정보(주문서), res: 응답을 보내는 도구(쟁반).
// 서버가 받은 정보(req)를 토대로 일(DB 처리 등)을 마치고,
// 그 결과를 res에 담아서 화면에 돌려준다.
router.get("/", async (req, res) => {
    try {
        // [rows]: pool.query 결과 [rows, fields] 중 첫 칸(실제 데이터)만 rows에 담는다.
        //await pool.query(...) 쿼리에서 결과가 올때까지 기다린다
        //AS employees 라고 별칭을 짓는다 이름을 붙이지 않으면 COUNT(*)라 꺼내기 불편
        const [rows] = await pool.query("SELECT COUNT(*) AS employees FROM employees");
        //   res.json(...): 객체를 JSON 글자로 바꿔 응답한다. rows[0].employees = 센 직원 수.
        res.json({ ok: true, employees: rows[0].employees });
    } catch (err) {// 만약 에러라면
        // catch: 에러가 나면 터미널에 에러 코드/메시지를 찍고,
        console.error("DB 연결 오류:", err.code, err.message);
        //   res.status(500): 서버 쪽 문제라는 500 번호표를 붙여 실패 응답을 보낸다.
        res.status(500).json({ ok: false, code: err.code, message: err.message });
    }
});

module.exports = router;
