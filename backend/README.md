# NEXUS ERP Backend

React 예제(day07_node)의 구조를 기준으로 만들고, DB만 NEXUS ERP 스키마(mydb_v3)에 맞췄습니다.

## 설치와 실행

```bash
cd backend
npm install
# .env 의 DB_PASSWORD 를 실제 비밀번호로 수정
npm start
```

## 폴더 구조 (각자 자기 이름 폴더 안에서만 작업)

```
backend/
 ├─ server.js        ← 공통. 멤버 폴더의 routes 를 연결만 함. 평소엔 수정 X
 ├─ db.js            ← 공통 DB 연결 풀. 수정 전 팀에 알리기
 ├─ .env             ← 공통 설정 (git 제외)
 └─ members/
     ├─ woojin/      로그인 / 회원가입 / 탈퇴        (auth.js)
     ├─ heeseung/    (비어 있음 – 여기서 시작)
     ├─ dong/        (비어 있음 – 여기서 시작)
     ├─ junwoo/      (비어 있음 – 여기서 시작)
     └─ jongho/      관리자 API /api/admin/...      (admin.js)
```

각 멤버 폴더의 `index.js` 는 `routes` 배열만 내보냅니다.

```js
// members/heeseung/index.js
const myRouter = require('./my');
module.exports = {
  routes: [{ prefix: '/api/heeseung', router: myRouter }],
};
```

새 API를 만들 때는 **내 폴더 안에 파일을 만들고 내 `index.js` 의 routes 에 한 줄 추가**하면 끝입니다. `server.js` 는 안 고쳐도 돼요.

### 충돌 안 나게 하는 규칙
1. 내 폴더 밖의 파일은 고치지 않는다. (`server.js`, `db.js`, `.env` 는 팀 합의 후)
2. 다른 사람 폴더의 라우트 주소(prefix)와 겹치지 않게 한다. 예) `/api/이름/...` 형태 권장
3. DB 접속은 `require('../../db')` 로 공통 풀을 쓴다. 새로 연결을 만들지 않는다.

## API

| 메서드 | 경로 | 요청 | 응답 |
|---|---|---|---|
| GET | /api/health | - | `{ ok, db }` |
| POST | /signup | `{ name, email, password }` | `{ result:'success', employeeId }` / 409 중복 |
| POST | /login | `{ email, password }` | 성공 `{ result:'success', id, name, email }` / 실패 `'fail'` |
| POST | /withdraw | `{ email }` | `'success'` / `'fail'` (퇴사 처리, 물리 삭제 아님) |
| GET | /api/admin/evaluations | - | 평가 목록 |
| GET | /api/admin/employees | - | 직원 목록 `{ id, name, email, status }` (비밀번호 제외) |

## 예제와 달라진 점

- DB 접속 정보는 코드가 아니라 `.env` 에 둡니다. 팀 공통 DB(AWS RDS `mydb_v3`)도 `.env` 의 `DB_*` 값으로만 연결합니다. 접속 정보를 코드에 직접 적지 않습니다.
- 비밀번호는 bcrypt 해시로 저장합니다. 예제는 평문 저장입니다.
- 탈퇴는 `DELETE` 대신 `employee_status = '퇴사'` 로 바꿉니다. 이슈, 평가 등이 직원 번호를 참조하기 때문입니다.
- 테이블과 컬럼은 NEXUS ERP 스키마(`employees.employee_name` 등)를 씁니다.

## 확인

- http://localhost:3333/api/health → `{"ok":true,"db":true}`
- http://localhost:3333/api/admin/evaluations → 평가 목록 JSON
