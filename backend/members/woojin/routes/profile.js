// ===== 연락처(전화번호·주소) 조회 · 수정 (GET/PUT /api/profile) =====
const express = require("express");
// express.Router(): "작은 app". server.js 의 app 처럼 get/post/put/delete 를 붙일 수 있고,
// 마지막에 module.exports 로 내보내면 woojin/index.js 가 받아서 주소 앞부분(/api/...)을 붙여 준다.
const router = express.Router();
const pool = require("../db");

//노멀라이즈 폰 정규식을 이용해 휴대폰 번호의 규칙을 정한다
function normalizePhone(input) {
    const digits = String(input).replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(digits)) return null;
    return digits.length === 11
        ? `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
        : `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}
//주소 최대 글자 길이 100
const MAX_ADDRESS_LENGTH = 100;

//get방식으로 /api/profile 요청을 오면 ()안의 함수를 실행
//어씽크는 어웨잇 사용한다 선언 
// req: 화면이 보낸 값을 읽는다. 처리한 결과는 res로 화면에 돌려준다.
router.get("/", async (req, res) => {
    // GET이라서 값이 주소 뒤의 ?employeeId=1 에 담겨 온다. (req.query = 쿼리 스트링, SQL 쿼리와는 다른 것)
    // 주소로 온 값은 글자라서 Number()로 숫자로 바꿔 employeeId에 담는다.
    const employeeId = Number(req.query.employeeId);

    //임플로이 아이디가 정수가 아니거나 0이하라면 
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        //리턴으로 함수를 여기서 끝내고 400 에러와 false , json 구조로 화면에 응답한다
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    try {// 트라이 안에서 오류가 나도 캐치까지 진행된다
        // await: DB 결과가 올 때까지 기다리고, [rows]에 결과의 첫 칸(조회된 줄들)을 담는다.
        // SELECT: 이 직원의 전화번호와 주소만 가져온다 (employee_phone → phone, employee_address → address 별명)
        // WHERE employee_id = ?: 이 직원 번호의 줄만. ?에는 [employeeId]가 들어간다.
        const [rows] = await pool.query(
            "SELECT employee_phone AS phone, employee_address AS address FROM employees WHERE employee_id = ?",
            [employeeId]
        );
        // rows.length === 0 : 조회된 줄이 0개 = 이 번호의 직원이 없다면
        if (rows.length === 0) {
            //리턴으로 함수를 여기서 끝내고 404와 false를 띄우며 json 구조로 화면에 응답한다 
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        // 위 if(길이 0)에 안 걸렸으니 직원이 있다.
        // ok: true와, 첫 번째 줄(rows[0])의 phone/address를 JSON으로 화면에 응답한다.
        // || "": 값이 비어 있으면(NULL) 빈 글자로 바꾼다.
        res.json({ ok: true, phone: rows[0].phone || "", address: rows[0].address || "" });
    } catch (err) {//트라이 안에서 오류가 났다면
        //서버 터미널에 "연락처 조회 오류:", err.code, err.message); 이걸 띄운다
        console.error("연락처 조회 오류:", err.code, err.message);
        //500에러 (서버) 와 false json으로 화면에 응답
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

//프로필에에서 수정 요청이 오면 ()안의 함수를 실행시키며
//임플로이 아이디에 숫자로 아이디를 받고 정수가 아니거나 0 이하면 리턴으로 함수를 끝내고
// 400에러와 펄스 를 띄우고 json 으로 화면에 응답

// PUT 방식으로 /api/profile 요청이 오면 ()안의 함수를 실행한다. (직원 연락처 수정)
router.put("/", async (req, res) => {
    // PUT은 값이 몸통(body)에 담겨 오므로 req.body로 읽는다. (GET은 req.query)
    // Number()로 숫자로 바꿔 employeeId에 담는다. (안 보냈거나 글자면 NaN이 된다)
    const employeeId = Number(req.body.employeeId);
    // 정수가 아니거나 0 이하면 return으로 끝내고 400 + ok: false를 JSON으로 응답한다.
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({ ok: false, message: "employeeId 가 필요해요." });
    }
    // raw = "가공 전(날것)". 사용자가 입력한 그대로의 전화번호라는 뜻의 변수 이름.
    // ?? "": 값이 없으면(null/undefined) 빈 글자로. 
    // (String(undefined)가 "undefined" 글자가 되는 걸 막기 위해 먼저 처리)
    // String(...): 글자로 바꾼다 (.trim()은 글자에만 쓸 수 있어서). .trim(): 앞뒤 공백 제거.
    const rawPhone = String(req.body.phone ?? "").trim();
    const address = String(req.body.address ?? "").trim();

    //  phone을 빈 글자로 시작. (let: 나중에 다시 담을 변수)
    let phone = "";
    //  사용자가 뭔가 입력했다면
    if (rawPhone !== "") {
        // rawPhone(입력 그대로)을 normalizePhone에 넣어 표준 모양으로 손질해 phone에 담는다. (번호가 아니면 null)
        phone = normalizePhone(rawPhone);
        if (!phone) {//null이면 = 전화번호 형식이 틀렸다면
            //return으로 함수를 끝내고 400 + ok: false + 안내 문구(예시 포함)를 JSON으로 응답한다.
            return res.status(400).json({ ok: false, message: "전화번호 형식을 확인해 주세요. 예) 010-1234-5678" });
        }
    }
    // 주소 글자 수가 MAX_ADDRESS_LENGTH(100)보다 크면 (DB 칸 길이 초과 방지)
    if (address.length > MAX_ADDRESS_LENGTH) {
        // return으로 함수를 끝내고 400 + ok: false + 안내 문구(최대 글자 수 포함)를 json으로 응답한다.
        return res.status(400).json({ ok: false, message: `주소는 ${MAX_ADDRESS_LENGTH}자 이하로 입력해 주세요.` });
    }

    try { // try 안에서 에러가 나면 아래 줄은 건너뛰고 바로 catch로 이동한다
        // UPDATE 쿼리를 실행하고, 그 결과 정보(처리된 행 개수 등)를 result에 담는다
        const [result] = await pool.query(
            "UPDATE employees SET employee_phone = ?, employee_address = ? WHERE employee_id = ?",
            // 물음표 자리에 순서대로 phone, address, employeeId를 넣는다 (WHERE: 이 직원 한 명만 수정)
            [phone, address, employeeId]
        );
        //affectedRows: 이번 UPDATE로 처리된 행의 개수. 0이면 수정할 직원(employee_id)이 없었다는 뜻
        if (result.affectedRows === 0) {
            //리턴으로 함수를 여기서 끝내고 404에러+ ok:false를 띄우며 json으로 화면에 응답
            return res.status(404).json({ ok: false, message: "직원을 찾을 수 없어요." });
        }
        // 성공: ok: true와 저장된 phone, address를 JSON으로 응답으로 보낸다 (기본 상태 코드 200)
        res.json({ ok: true, phone, address });
    } catch (err) { // try 안에서 에러가 났다면
        // 서버 터미널에 "연락처 저장 오류:"와 에러 코드·메시지를 찍는다 (개발자용 상세 원인)
        console.error("연락처 저장 오류:", err.code, err.message);
        // 500(서버 문제) + ok: false + 일반 안내 문구를 JSON으로 응답한다 (상세 원인은 사용자에게 숨김)
        res.status(500).json({ ok: false, message: "서버 오류가 났어요." });
    }
});

module.exports = router;
