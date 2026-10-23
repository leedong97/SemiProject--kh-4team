# 4조 ERP 프론트 – 폴더 구조와 작업 규칙

## 실행
```
cd frontend
npm install
npm start        (http://localhost:3000)
```

## 폴더 구조 (각자 자기 이름 폴더 안에서만 작업)
```
src/
 ├─ index.js          ← BrowserRouter(주소 관리자)는 여기 딱 1번만. 건드리지 않기
 ├─ App.js            ← 각 폴더의 index.js 를 "가져다 연결만" 함. 평소엔 수정 X
 ├─ shared/           ← 팀 공통 (위쪽 메뉴바 TeamShell.js, shell.css, user.js). 수정 전 팀에 알리기
 └─ pages/
     ├─ woojin/       로그인 / 회원가입 / 마이페이지
     ├─ heeseung/     (비어 있음 – 여기서 시작)
     ├─ dongyi/       이슈관리
     ├─ junwoo/       대시보드(메인) / 업무·프로젝트(todo) / 공지사항 / 캘린더
     └─ jongho/       관리자 (/admin/...)
```

## 각 폴더의 index.js 가 하는 일
| 내보내는 것 | 뜻 |
|---|---|
| `Provider` | 내 페이지들이 같이 쓰는 데이터(state)를 담는 상자 (없으면 생략) |
| `shellRoutes` | 위쪽 메뉴바가 있는 화면의 주소 목록 |
| `standaloneRoutes` | 메뉴바 없이 내 화면 전체를 쓰는 주소 목록 |

새 페이지를 만들면 **내 폴더의 index.js 에 주소 한 줄만 추가**하면 끝이에요. App.js 는 안 고쳐도 돼요.

## 충돌 안 나게 하는 규칙 5가지
1. 내 폴더 밖의 파일은 고치지 않는다. (shared/, index.js, App.js 는 팀 합의 후)
2. `BrowserRouter` 를 다시 쓰지 않는다. 주소 이동은 `Link`, `useNavigate` 만.
3. CSS는 내 폴더 안의 css 파일에만 쓴다. `App.css` 는 없앴어요.
4. CSS 클래스 이름 앞에 내 이름표를 붙인다. 예) 동협 `issue-...`, 준우 `todo-... info-... calendar-...`, 종호 `nexus-...`, 우진 `mp-...`
5. 팀 화면(메뉴바 안)의 CSS는 선택자 앞에 `.team-shell` 을 붙인다. (이미 붙어 있어요)

## 주소 목록
| 주소 | 담당 |
|---|---|
| `/` , `/todo`, `/todo/set`, `/todo/:id`, `/info`, `/info/set`, `/info/:id` | junwoo |
| `/issue`, `/issue/:id` | dongyi |
| `/login`, `/signup`, `/mypage` | woojin |
| `/admin`, `/admin/projects`, `/admin/assignments`, `/admin/issues`, `/admin/employees`, `/admin/evaluations`, `/admin/boards`, `/admin/settings` | jongho |

## 합치면서 정리한 것
- App.js 에 모여 있던 state(공지·프로젝트·이슈)는 각 폴더의 `*Context.js` 로 옮김 (내용 그대로).
- 5곳에 있던 빈 껍데기 파일(Dash/Issue/Todo/Mypage 임시 파일)과 복사본 `Info*`·`Calendar` 는 최신본(준우) 하나만 남김.
- 로그인: 종호의 데모 로그인(Login.js)은 우진의 로그인 하나로 통일. 관리자 로그아웃은 `/login` 으로 이동.
- 종호 폴더는 희승 버전 대신 종호 버전만 사용.
- 동협 `issue_study.js` (공부용 파일)는 동협 폴더에 그대로 보관(어디서도 불러오지 않음).
- `App.css` 는 `shared/shell.css`(메뉴바) + `junwoo.css` + `dongyi.css` 로 나눔. 내용은 그대로, 선택자 앞에 `.team-shell` 만 붙임.

## 아직 정해야 할 것
- 로그인 상태 유지와 `/admin`, `/mypage` 보호 (지금은 주소로 바로 들어가짐)
- 관리자 이슈관리(종호)와 이슈관리(동협)의 중복 정리
- 메뉴바 이름은 `shared/user.js` 더미 값 (로그인 연결 시 교체)
