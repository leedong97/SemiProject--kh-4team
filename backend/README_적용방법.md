# 백엔드 수정본 적용 방법

1. 기존 프로젝트와 MySQL DB를 백업하세요.
2. `backend` 폴더에 수정본 파일을 덮어쓰세요. 기존 `server.js`, `db.js`는 그대로 유지됩니다.
3. 프로젝트 최상위 `.env`에 `AUTH_SECRET=` 뒤로 32자 이상의 무작위 비밀 문자열을 추가하세요. 이 값은 Git에 올리지 마세요.
4. `cd backend` → `npm install` → `npm start`.
5. 로그인 `POST /api/login` 응답의 `token`을 프론트에서 보관하고, 관리자 API 요청 시 `Authorization: Bearer <token>` 헤더를 전달해야 합니다.

## API
- `GET /api/hr/employees?sort=salary|department|grade` 재직 직원 조회 (`display_status` 계산)
- `GET /api/hr/retired` 퇴사 직원 조회
- `PATCH /api/hr/employees/:id` 부서/직급/연봉 수정 및 변경 이력 저장
- `PATCH /api/hr/employees/:id/retire` 퇴사 처리
- `GET /api/hr/leaves` 휴가 목록
- `POST /api/hr/leaves` 휴가 신청 (`employee_id`, `leave_type`, `start_date`, `end_date`)
- `PATCH /api/hr/leaves/:id` 휴가 승인/반려 (`status`)
- `GET /api/management/overdue-projects` 기간 초과 프로젝트
- `GET /api/management/overdue-projects/:id/issues` 해당 프로젝트 이슈
- `POST /api/management/evaluations` 프로젝트 참여자 평가

## 주의
- 현재 HRManagement.js는 `changeData`로 React 상태만 수정합니다. **백엔드만 교체하면 화면과 DB가 자동 연결되지 않습니다.** React의 신청/승인 함수에서 API 호출 및 직원 목록 재조회로 변경해야 합니다.
- DB에는 `employee_retired_at`, `employee_change_logs`, `employee_evaluations.project_id`가 존재해야 합니다. 평가 점수 CHECK는 0~100이어야 합니다.
- 현재 구현은 관리자 권한의 초기 기반입니다. 운영 배포 전 HTTPS, 로그인 시도 제한, 세션 폐기, 감사로그, 휴가 중복 동시성 처리, 연차 차감 및 개인정보 접근 정책을 보완하세요.
- `employee_grade` 허용값은 팀장/부장/이사/대표로 가정했습니다. 실제 회사의 직급 체계에 맞춰 수정하세요.
