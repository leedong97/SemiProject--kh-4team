// ===== 로그인 · 회원가입 (POST /api/login, POST /api/signup) =====
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();

//비클립스 제이에스 라이브러리를 가져와 비클립스에 담는다
//비밀번호를 되돌릴 수 없는 암호문(해시)로 바꾼다
const bcrypt = require("bcryptjs");
// 공용 DB 풀 (한 단계 위 폴더 woojin/db.js)
const pool = require("../db");

// POST 방식으로 /api/login 요청이 오면 ()안의 함수를 실행한다.
// async: 함수 안에서 await(DB 결과 기다리기)를 쓰겠다는 선언.
// req로 화면이 보낸 정보(이메일, 비밀번호)를 읽고, DB에서 일을 마친 뒤 결과를 res에 담아 돌려준다.
router.post("/login", async (req, res) => {
    // 콘스트 이메일과 페스워드에 리퀘스.바디로 받아온 정보를 담는다
    const { email, password } = req.body;
    //만약 이메일과 비밀번호가 하나라도 비어있다면 res에 400 에러와 펄스를 보여주고 제이슨 구조로 메시지를 띄운다
    if (!email || !password) {
        return res.status(400).json({ ok: false, message: "이메일과 비밀번호를 입력해 주세요." });
    }
    try {
        // try: 이 안에서 (await 중이든 아니든) 에러가 나면 서버가 죽지 않고 catch로 넘어가서 처리한다.
        //const[rows] 에 쿼리문 안에 있는 값을담는데 임플로이 이메일에 ? 자리에  [email] 값이들어간다
        const [rows] = await pool.query(
            "SELECT employee_id, employee_code, employee_name, employee_division, employee_team, " +
            "employee_position, employee_grade, employee_role, employee_status, employee_pw " +
            "FROM employees WHERE employee_email = ?",
            [email]
        );
        // const emp에 rows[0]담겨있는 값을 담는다
        const emp = rows[0];
        //"직원(emp)이 있으면 → 비밀번호를 비교한 결과를 same에, 없으면 → false를 same에 담아라"
        const same = emp ? await bcrypt.compare(password, emp.employee_pw) : false;
        // !same = same이 false = 로그인 정보(이메일/비밀번호)가 맞지 않다면
        if (!same) {
            // 리턴으로 여기서 함수를 끝내고
            // 401 에러와 false 그리고 json 형식으로 응답하고 화면은 React가 띄운다
            return res.status(401).json({ ok: false, message: "이메일 또는 비밀번호가 맞지 않아요." });
        }//재직중인 사람이 아니라면
        if (emp.employee_status !== "재직") {
            // 리턴으로 여기서 함수를 끝내고
            // 403 에러와 false 그리고 제이슨 타임으로 메세지 띄운다
            return res.status(403).json({ ok: false, message: "재직 중인 직원만 로그인할 수 있어요." });
        }
        // delete: emp 객체에서 employee_pw(비밀번호 해시) 칸을 지운다.
        // 이유: 아래에서 emp를 화면으로 응답하는데, 비밀번호 해시는 노출하면 안 되기 때문.
        // (DB의 원본은 그대로. 지워지는 건 메모리 속 복사본뿐)
        delete emp.employee_pw;
        res.json({ ok: true, user: emp });
        // 모든 검사를 통과했으니 성공 응답(200)을 JSON 형식으로 화면에 보낸다.
        // ok: true = 성공 표시, user: emp = 로그인한 직원 정보(비밀번호 해시는 위에서 지움)
    } catch (err) { // try 안에서 예상 못 한 에러가 나면 여기로 온다
        // 서버 터미널에 에러 종류(code)와 설명(message)을 찍는다 (개발자 확인용)
        console.error("로그인 오류:", err.code, err.message);
        // 500(서버 문제) + ok: false + 일반 안내 문구만 JSON으로 화면에 응답한다.
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

// 회원가입 이름 최대 글자 수: 50 (DB 칸 길이 초과 방지)
// 회원가입 비밀번호 최소 글자 수: 8
// 회원가입 비밀번호 최대 바이트 수: 72 (bcrypt가 앞 72바이트만 쓰기 때문에 그 이상은 막는다)
// 이메일 모양 검사 정규식: 글자 + @ + 글자 + . + 글자 (공백, @ 중복은 불가)
const SIGNUP_NAME_MAX = 50;
const SIGNUP_PW_MIN = 8;
const SIGNUP_PW_MAX_BYTES = 72;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// ===== 회원가입 시작 =====
// Signup.js의 axios.post("/api/signup")가 보낸 값(name, email, password)을
// 서버는 req.body로 받는다.
// post 방식으로 /api/signup 주소 요청이 오면 () 안의 함수를 실행한다.
// async: 이 함수 안에서 await를 쓸 수 있게 선언한다.
// req로 들어온 정보를 받아 DB에서 처리한 뒤, 결과를 res에 담아 응답한다.
router.post("/signup", async (req, res) => {
    // req.body(화면이 보낸 값)를 body에 담고, 없으면 빈 객체 {}를 담는다. (undefined 접근 에러 방지)
    const body = req.body || {};
    //const name 에 typeof body.name이 문자열이면 앞뒤 공백을 지운 body.name을 담고 없으면 ""을 담는다
    // (문자열이 아닌 값에 trim()을 쓰면 에러가 나기 때문에 먼저 타입을 확인한다)
    const name = typeof body.name === "string" ? body.name.trim() : "";
    //const email 에 typeof body.email이 문자열이면 앞뒤 공백을 지운body.email을 소문자로 담고
    //문자열이 아니면(없거나 수자 등) ""을 담는다
    // (대소문자만 다른 중복 가입과 로그인 불일치를 막기 위해 소문자로 통일)
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    // password에 body.password의 타입이 문자열이면 그 값을 그대로 담고, 아니면 ""를 담는다.
    // (비밀번호는 공백·대소문자도 의미가 있어서 trim()과 toLowerCase()를 쓰지 않는다)
    const password = typeof body.password === "string" ? body.password : "";

    //name이 비어있거나 name의 길이가 SIGNUP_NAME_MAX 를 초과했을경우
    if (!name || name.length > SIGNUP_NAME_MAX) {
        //함수를 여기서 끝내고 400 + ok:false + 안내문구를 json 으로 화면에 응답한다
        return res.status(400).json({ ok: false, message: `이름은 1~${SIGNUP_NAME_MAX}자로 입력해 주세요.` });
    }
    // email이 EMAIL_PATTERN 모양에 맞지 않거나(!test) 200자를 초과하면
    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
        //리턴으로 함수를 여기서 끝내고 400 + ok:false + 안내문구를 json으로 화면에 응답한다
        return res.status(400).json({ ok: false, message: "이메일 형식이 올바르지 않아요." });
    }
    // password의 글자 수가 SIGNUP_PW_MIN(8)보다 작으면
    if (password.length < SIGNUP_PW_MIN) {
        ///리턴으로 함수를 여기서 끝내고 400 + ok:false + 안내문구를 json으로 화면에 응답한다
        return res.status(400).json({ ok: false, message: `비밀번호는 ${SIGNUP_PW_MIN}자 이상이어야 해요.` });
    }
    // password를 utf8로 바꿨을 때의 바이트 수가 SIGNUP_PW_MAX_BYTES(72)를 초과하면 (bcrypt 한도)
    if (Buffer.byteLength(password, "utf8") > SIGNUP_PW_MAX_BYTES) {
        //리턴으로 함수를 여기서 끝내고 400 + ok:false + 안내문구를 json으로 화면에 응답한다
        return res.status(400).json({ ok: false, message: "비밀번호가 너무 길어요." });
    }

    //let conn 변수 선언
    let conn;



    // 여기부터 DB 작업: 해시 → INSERT → UPDATE → commit
    try {//try안에서 오류가 나면 catch로 보냄

        // 비밀번호를 bcrypt로 해시한다. 10 = 연산 강도(cost, 클수록 느리고 안전)
        // 해시 계산은 시간이 걸려서 await로 결과가 나올 때까지 기다린 뒤 hash에 담는다.
        const hash = await bcrypt.hash(password, 10);

        //선언했던 변수 conn에 풀.겟커넥션을 await으로 결과가 나올 때까지 기다린 뒤 담는다.
        conn = await pool.getConnection();
        // conn 연결에서 트랜잭션(여러 작업을 한 덩어리로 묶기)을 시작하고, 시작이 끝날 때까지 기다린다.
        // 이후 작업이 전부 성공하면 commit(저장), 중간에 실패하면 rollback(전부 취소)한다.
        await conn.beginTransaction();

        // conn(트랜잭션이 걸린 연결)으로 INSERT를 실행하고, 돌려받은 배열의 첫 값(처리 결과)을 result에 담는다. await로 기다린다.
        // SQL의 ?는 배열 [name, email, hash]의 값이 순서대로 들어간다. (1번째 ?=name, 2번째 ?=email, 3번째 ?=hash)
        // 부서·팀·직급·등급='미배정', 권한='일반 사용자', 상태='재직'은 서버가 고정하고, 입사일은 CURDATE()(오늘)로 넣는다.
        const [result] = await conn.query(
            "INSERT INTO employees (employee_name, employee_division, employee_team, employee_position, " +
            "employee_grade, employee_role, employee_status, employee_email, employee_hire_date, employee_pw) " +
            "VALUES (?, '미배정', '미배정', '미배정', '미배정', '일반 사용자', '재직', ?, CURDATE(), ?)",
            [name, email, hash]
        );


        // code에 사번을 만들어 담는다. "EMP-"라는 글자 뒤에 방금 INSERT된 행의 번호(insertId)를 붙인다.
        // String(): 숫자를 글자로 바꾼다 (padStart는 글자에만 쓸 수 있어서)
        // padStart(3, "0"): 앞쪽을 "0"으로 채워 길이를 3으로 맞춘다. (예: 5 ->"005")
        // padend(3,"1")는 뒤쪽을 채운다 (예: 5->"511")
        const code = "EMP-" + String(result.insertId).padStart(3, "0");

        // conn으로 UPDATE를 실행하고 DB가 끝낼 때까지 기다린다. (결과 정보는 안 써서 변수에 안 담음)
        // 첫 번째 ? = code(사번), 두 번째 ? = result.insertId(방금 만든 직원 번호) 순서로 들어간다.
        // INSERT로 번호가 정해진 뒤에야 사번을 만들 수 있어서, 같은 트랜잭션 안에서 사번 칸을 채운다.
        await conn.query("UPDATE employees SET employee_code = ? WHERE employee_id = ?", [code, result.insertId]);

        // 트랜잭션 안의 INSERT와 UPDATE를 DB에 확정 저장(commit)하고, 끝날 때까지 기다린다.
        await conn.commit();
        //201+ok:true + 안내문구를 json 구조로 화면에 응답한다(화면에 보여주는건 React가 한다)
        res.status(201).json({ ok: true, message: "회원가입이 완료되었어요." });

    } catch (err) {//try에서 에러가 났을경우
        if (conn) {// conn에 연결이 담겨 있을 때만 (getConnection 자체가 실패했다면 undefined라 건너뜀)
            // 롤백(트랜잭션 전부 취소)을 시도한다. 롤백 자체가 실패해도 무시하고
            // 원래 에러 처리를 계속 진행한다.
            try { await conn.rollback(); } catch (e) {/* 롤백 실패는 무시 */ }
        }
        // 에러 코드가 ER_DUP_ENTRY(중복 값)이고, 에러 메시지 안에 employee_email이 들어 있으면 (= 이메일 중복)
        // err.sqlMessage → err.message → "" 순서로 처음 값이 있는 것을 쓴다. (.test는 글자에만 쓸 수 있어서 ""가 안전장치)
        if (err.code === "ER_DUP_ENTRY" && /employee_email/.test(err.sqlMessage || err.message || "")) {
            //함수를 여기서 끝내고 409 + ok:false + 안내매시지를 json으로 화면 응답
            return res.status(409).json({ ok: false, message: "이미 가입된 이메일이에요." });
        }
        // 위 이메일 중복 처리에 해당하지 않는 다른 에러라면,
        // 터미널(서버 콘솔)에 "회원가입 오류:"라는 이름표와 에러 코드, 에러 메시지를 찍는다. (개발자가 원인을 찾기 위한 기록)
        console.error("회원가입 오류:", err.code, err.message);
        //500+ok:false + 안내문구 + json구조로 화면에 응답
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });

    } finally {// finally: 성공하든 에러가 나든(return으로 끝나도) 마지막에 항상 실행되는 블록.

        //	이전에 정리한 "연결(택시)을 풀에 반납한다" 
        if (conn) conn.release();
    }
});

module.exports = router;
