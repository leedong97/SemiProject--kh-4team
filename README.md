# COMMAND ERP – B 방식 통합본 (`SemiProject--b-merged`)

서버는 **메인 서버 1개(포트 3333)** + 팀원별 **Router 조각**으로 구성돼요. React 는 3000.

## 실행 순서
1. `.env.example` 을 복사해 **`.env`** 로 이름 변경(이 폴더 맨 위) → `DB_PASSWORD` 등 본인 값 입력
2. `sql/` 안의 SQL 실행 (이미 했다면 건너뛰기)
   - `01_notices_event_date.sql` : `notices.event_date` 컬럼 (없을 때만)
   - `02_admin_migration.sql` : 관리자 감사 로그 테이블
3. `install-all.bat` (처음 한 번) → `start-all.bat`
4. 브라우저: http://localhost:3000  /  서버 확인: http://localhost:3333/api/health

## 폴더 구조
```
backend/
  server.js        메인 서버 (dotenv → cors → json → 팀원 Router 연결 → JSON 404 → listen 1번)
  db.js            모두가 같이 쓰는 DB 풀
  members/
    woojin/  로그인·회원가입·마이페이지·일정·프로필   (원본: kh-4team-woojin 최신)
    junwoo/  dashboard.js · notices.js · projects.js   (원본: backend-junwoo/server.js 를 3조각으로)
    dong/    이슈 조회  → /api/dong/projects, /api/dong/issues
    heeseung/ (API 없음)
    jongho/  관리자 /api/admin/*   (admin.js, 개발용: 로그인 검사 없음)
frontend/src/
  shared/config.js   API_BASE (서버 주소 한 곳) ← 모든 fetch/axios 가 이걸 사용
  pages/woojin | junwoo | dong | heeseung | jongho | preview | pricing
```

## API 주소 (겹침 없음)
| 담당 | 주소 |
|---|---|
| 우진 | `/api/login` `/api/signup` `/api/schedules` `/api/leaves` `/api/my-*` `/api/profile` `/api/health` |
| 준우 | `/api/dashboard/schedules` `/api/notices(/:id…)` `/api/projects(/:id…)` |
| 동협 | `/api/dong/projects` `/api/dong/issues` ← 원래 `/api/projects` 였으나 준우와 겹쳐서 이동 |
| 종호 | `/api/admin/*` |
| 공통 | `/api/db-check` |

## 새 API 추가하는 법
`backend/members/내이름/` 에 Router 파일을 만들고 `index.js` 의 `routes` 에
`{ prefix: '/api/내이름', router }` 한 줄 추가. **`app.listen`, `dotenv`, `new Pool` 은 쓰지 않기!**

## 알아둘 점
- 동협님 서버의 DB 비밀번호(코드에 직접 적혀 있던 값)는 **가져오지 않았어요.** 모든 접속 정보는 `.env` 만 사용.
- 종호 관리자 API 는 로그인 검사가 없는 개발용이에요. 외부 공개 전에 `members/jongho/adminSecurity.js` 방식으로 교체 필요.
- 이 통합본은 `npm install` 없이 만들어서, **실제 실행 테스트는 처음 `start-all.bat` 때 확인**이 필요해요.
