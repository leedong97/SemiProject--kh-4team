// ===== 일정 조회 · 등록 · 수정 · 삭제 (/api/schedules ...) =====
// 주소 앞부분 "/api/schedules" 는 woojin/index.js 에서 붙여 주기 때문에 여기서는 "/" 와 "/:id" 만 쓴다.
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();
const pool = require("../db");

// GET 방식으로 /api/schedules 요청이 오면 실행된다. (직원 한 명의 일정 목록 조회)
// async: 함수 안에서 await(DB 결과 기다리기)를 쓰겠다는 선언.
// DB에서 일정을 조회한 뒤 res로 결과를 돌려준다.
router.get("/", async (req, res) => {
    // req로 화면이 보낸 값을 읽는다. GET이라서 주소의 ?employeeId=1 부분을 req.query로 읽는다.
    // 주소로 온 값은 글자라서 Number()로 숫자로 바꿔 employeeId에 담는다.
    const employeeId = Number(req.query.employeeId);
    // employeeId가 정수가 아니거나(NaN, 소수 등) 0 이하이면 (직원 번호는 1부터 시작하므로)
    // return으로 함수를 여기서 끝내고, 400(잘못된 요청) + ok: false + 안내 문구를 JSON 형식으로 응답한다
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {  // 이 안에서 에러가 나면 서버가 죽지 않고 catch로 넘어간다
        // [rows]: 쿼리 결과 [rows, fields] 중 첫 칸(조회된 일정 줄들)을 rows에 담는다.
        // AS: DB 칸 이름을 화면이 쓰는 이름(id, title, start...)으로 바꿔서 가져온다.
        // DATE_FORMAT/TIME_FORMAT: 날짜/시간을 "2026-10-22", "09:30" 같은 글자로 바꾼다 (시간대로 날짜가 밀리는 문제 방지).
        // WHERE employee_id = ?: 이 직원의 일정만, ?에는 [employeeId]가 들어간다.
        // ORDER BY: 시작 날짜 순, 같으면 시간 순으로 정렬한다.
        const [rows] = await pool.query(
            "SELECT schedule_id AS id, schedule_title AS title, " +
            "DATE_FORMAT(schedule_start_date, '%Y-%m-%d') AS `start`, " +
            "DATE_FORMAT(schedule_end_date, '%Y-%m-%d') AS `end`, " +
            "TIME_FORMAT(schedule_time, '%H:%i') AS `time`, " +
            "schedule_type AS `type` " +
            "FROM schedules WHERE employee_id = ? " +
            "ORDER BY schedule_start_date, schedule_time",
            [employeeId]
        );

        // rows.map: 조회된 일정을 한 줄씩(r) 꺼내 변환한 새 배열을 만든다.
        // ...r: 그 줄의 모든 칸을 그대로 복사하고,
        // time: r.time || "" : time이 비어 있으면(NULL, 예: 휴가) 빈 글자 ""로 바꿔서 덮어쓴다. (뒤에 쓴 게 앞을 덮어씀)
        // res.json: ok: true와 변환한 일정 배열(schedules)을 JSON으로 화면에 응답한다.
        res.json({ ok: true, schedules: rows.map((r) => ({ ...r, time: r.time || "" })) });
    } catch (err) {// try 안에서 에러 나면
        //서버 터미널에 일정 조회 오류 , + 에러코드 에러 메시지 띄움
        console.error("일정 조회 오류:", err.code, err.message);
        // 500(서버 문제) + ok: false + 일반 안내 문구만 JSON으로 화면에 응답한다.
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// ===== 일정 등록 · 수정 · 삭제 =====
// 일정 제목 최대 글자 수 (DB 칸 길이보다 길면 저장이 실패한다. schedule_title 칸 길이 확인 필요)
// 일정 종류는 이 4가지만 허용한다.
// 날짜는 2026-10-22 모양, 시간은 09:30 모양(00:00~23:59)만 허용한다.
const SCHEDULE_TITLE_MAX = 100;
const SCHEDULE_TYPES = ["개인", "업무", "휴가", "프로젝트"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// 화면이 보낸 일정 값(body)을 검사하는 함수. 등록(POST)과 수정(PUT)이 똑같이 쓴다.
// 문제가 있으면 { message: 안내 문구 }를, 괜찮으면 { title, start, end, time, type }을 돌려준다.
function checkSchedule(body) {
    //바디.타이틀의 타입이 문자열이라면 앞뒤 공백을 제거한 바디타이틀을 담고 아니라면 "" 빈문자열을 담는다
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const start = typeof body.start === "string" ? body.start : "";
    const end = typeof body.end === "string" ? body.end : "";
    const time = typeof body.time === "string" ? body.time : "";
    const type = typeof body.type === "string" ? body.type : "";

    //타이틀이 비어있거나 타이틀 글자 길이가 스케쥴타이틀맥스의 길이보다 크면 
    if (!title || title.length > SCHEDULE_TITLE_MAX) {
        //리턴으로 함수를 여기서 끝내고 {} 안에 안내문구를 담아 함수add.post 쪽으로 보낸다?
        return { message: `일정 제목은 1~${SCHEDULE_TITLE_MAX}자로 입력해 주세요.` };
    }
    if (!DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
        return { message: "날짜 형식이 올바르지 않아요." };
    }
    if (end < start) {
        // YYYY-MM-DD 형식은 글자로 비교해도 날짜 순서가 맞다
        return { message: "종료일은 시작일과 같거나 그 이후여야 해요." };
    }
    // 시간은 비어 있어도 된다(휴가·프로젝트). 값이 있으면 모양을 검사한다.
    if (time !== "" && !TIME_PATTERN.test(time)) {
        return { message: "시간 형식이 올바르지 않아요." };
    }  //인클루즈 배열안에 내가 찾는 값이 있나 검사
    if (!SCHEDULE_TYPES.includes(type)) {
        return { message: "일정 종류가 올바르지 않아요." };
    }
    return { title, start, end, time, type };
}

// POST 방식으로 /api/schedules 요청이 오면 새 일정을 DB에 저장한다.
router.post("/", async (req, res) => {
    const body = req.body || {};
    // 어느 직원의 일정인지 (GET 조회와 똑같이 직원 번호로 구분한다)
    const employeeId = Number(body.employeeId);
    //Number 숫자를 받고 isInteger (소수점,nan 을 걸러내고) 정수를 판별 뭐를 (employeeId)
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    // checkSchedule(body)로 입력값을 검사·정리해서, 돌려받은 결과를 data에 담는다
    const data = checkSchedule(body);
    // data에 massage가 붙어 왔다면 
    if (data.message) {
        return res.status(400).json({ ok: false, message: data.message });
    }

    try {
        // data.time || null : 시간이 빈 글자("")면 NULL로 저장한다. (시간 칸에 ""를 넣으면 DB가 에러를 낸다)
        // 여기서는 ""도 "없음"으로 봐야 해서 ??가 아니라 ||를 쓴다.
        const [result] = await pool.query(
            "INSERT INTO schedules (employee_id, schedule_title, schedule_start_date, schedule_end_date, schedule_time, schedule_type) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
            [employeeId, data.title, data.start, data.end, data.time || null, data.type]
        );
        // 201(새로 만들어짐) + DB가 만든 일정 번호(insertId)를 돌려준다. 화면은 이 번호를 id로 쓴다.
        res.status(201).json({ ok: true, id: result.insertId });
    } catch (err) {
        // 없는 직원 번호면 FK(외래키) 검사에서 걸린다 (FK가 걸려 있을 때)
        if (err.code === "ER_NO_REFERENCED_ROW_2") {
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        console.error("일정 등록 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// PUT 방식으로 /api/schedules/숫자 요청이 오면 그 번호의 일정을 수정한다.
// 주소의 :id 부분은 req.params.id로 읽는다.
router.put("/:id", async (req, res) => {
    // 넘버로 받은 리퀘스트 파람즈 아이디를 스케쥴 아이디에 담는다
    //주소에 ?로 물어보면 query(좀더 포괄적으로 집는게 가능할떼)
    //그냥 물오보면 params (하나만 콕 집는게 가능할때)
    const scheduleId = Number(req.params.id);
    //리퀘스트.바디 정보가 있다면 바디에 담고 없다면 {} 빈 객체 값을 담는다
    const body = req.body || {};
    // 요청 본문(body)의 employeeId를 숫자로 바꿔 담는다
    const employeeId = Number(body.employeeId);
    //scheduleId 가 정수가 아니거나 0 보다 이하면 employeeId 가 정수가 아니거나 0 보다 이하면
    if (!Number.isInteger(scheduleId) || scheduleId <= 0 || !Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "일정 번호와 employeeId 가 필요해요." });
    }
    //checkSchedule에 body를 넘겨 검사·정리하고, 돌려받은 결과를 data에 담는다
    const data = checkSchedule(body);
    //data에 담길때 매시지가 딸려왔다면
    if (data.message) {
        return res.status(400).json({ ok: false, message: data.message });
    }

    try {
        // WHERE schedule_id = ? AND employee_id = ? : 내 일정만 고칠 수 있게 직원 번호도 함께 조건으로 둔다.
        const [result] = await pool.query(
            "UPDATE schedules SET schedule_title = ?, schedule_start_date = ?, schedule_end_date = ?, " +
            "schedule_time = ?, schedule_type = ? WHERE schedule_id = ? AND employee_id = ?",
            [data.title, data.start, data.end, data.time || null, data.type, scheduleId, employeeId]
        );
        // 고친 줄이 0이면 조건에 맞는 일정이 없다는 뜻이라 404로 응답한다.
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "일정을 찾을 수 없어요." });
        }

        res.json({ ok: true });
    } catch (err) {
        console.error("일정 수정 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// DELETE 방식으로 /api/schedules/숫자 요청이 오면 그 번호의 일정을 삭제한다.
// DELETE 요청은 보통 body를 쓰지 않아서, 직원 번호는 주소 뒤(?employeeId=1)에서 req.query로 읽는다.
router.delete("/:id", async (req, res) => {
    const scheduleId = Number(req.params.id);
    const employeeId = Number(req.query.employeeId);
    if (!Number.isInteger(scheduleId) || scheduleId <= 0 || !Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "일정 번호와 employeeId 가 필요해요." });
    }

    try {
        const [result] = await pool.query(
            "DELETE FROM schedules WHERE schedule_id = ? AND employee_id = ?",
            [scheduleId, employeeId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: "일정을 찾을 수 없어요." });
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("일정 삭제 오류:", err.code, err.message);
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

module.exports = router;
