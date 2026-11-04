# 백엔드 수정본 적용

1. 기존 프로젝트와 DB를 백업하세요.
2. ZIP의 backend 폴더를 기존 프로젝트에 덮어쓰세요.
3. 프로젝트 최상위 .env에 AUTH_SECRET= 뒤에 32자 이상의 무작위 비밀 문자열을 설정하세요. Git에 올리지 마세요.
4. backend 폴더에서 npm install 후 npm start 실행.
5. POST /api/login 응답의 token을 프론트에서 사용하고, API 요청에 Authorization: Bearer <token> 헤더를 전달하세요.

API: GET /api/hr/employees, GET /api/hr/retired, PATCH /api/hr/employees/:id, PATCH /api/hr/employees/:id/retire, GET/POST /api/hr/leaves, PATCH /api/hr/leaves/:id, GET /api/management/overdue-projects, GET /api/management/overdue-projects/:id/issues, POST /api/management/evaluations.

중요: 현재 HRManagement.js는 changeData로 프론트 상태만 변경합니다. 백엔드 파일만 덮어써서는 화면이 자동 연동되지 않습니다. React API 호출 수정이 별도로 필요합니다.

DB 선행조건: employee_retired_at, employee_change_logs, employee_evaluations.project_id, 평가점수 0~100 CHECK. 운영 전 HTTPS, 로그인 시도 제한, 세션 폐기, 휴가 중복 동시성, 개인정보 접근, 평가 중복 정책을 추가 검증해야 합니다.
