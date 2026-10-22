# NEXUS ERP 통합 React 프로젝트

두 ZIP 파일을 분석해 통합했습니다. **MySQL / Express 없이 React만 실행**합니다.

## 실행

1. Cursor에서 이 폴더를 엽니다.
2. 터미널에서 `npm.cmd install` 실행
3. `npm.cmd start` 실행
4. http://localhost:3000 접속 → 로그인 화면

데모 로그인: `admin@demo.local` / `Demo1234!`

**주의:** 이 계정은 화면 시연용입니다. 브라우저에서만 인증하므로 관리자 보안이 아닙니다. 실명·평가 정보·개인정보를 입력하지 마세요.

## 통합 화면

- `/admin` 통합 대시보드 (프로젝트·이슈·직원·평가)
- `/admin/projects` 기존 팀 프로젝트 관리
- `/admin/assignments` 기존 담당자 배정 (인사 데이터와 연동)
- `/admin/issues` project11 이슈 관리
- `/admin/employees` project11 인사 관리
- `/admin/evaluations` project11 직원 평가
- `/admin/settings` 샘플 데이터 초기화

## 데이터

- `useErpData.js`: 이슈/직원/평가를 localStorage에 저장
- `admin/data/useProjects.js`: 프로젝트를 별도 localStorage에 저장
- 두 화면에서 사용하는 직원 목록은 `data.employees` 하나로 통일
- 프로젝트와 이슈/인사 데이터는 브라우저별로 저장되며 서로 다른 PC에서는 공유되지 않음

## 제한 사항

- 실제 로그인 인증, 역할별 보안, MySQL, 서버 감사 로그 없음
- 공지 관리 화면은 연결을 위한 빈 화면
- 이슈와 프로젝트는 현재 서로 직접 연결되지 않음 (추후 `projectId` 추가 권장)
- 프로젝트 변경은 감사 로그에 아직 통합되지 않음
- 브라우저 캐시/사이트 데이터 삭제 시 연습 데이터 소실 가능
- React 빌드 및 실제 브라우저 동작은 실행 환경에서 확인 필요
