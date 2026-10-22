# IT ERP 두 프로젝트 통합 설명서 (초보자용)

## 1. 어떤 파일을 기준으로 합쳤나요?

- `SemiProject--kh-4team-jongho.zip`: `AdminLayout.js` + React Router + 프로젝트/담당자 배정
- `project11.zip`: 이슈/인사/평가 컴포넌트 + 데모 로그인 + localStorage 데이터 관리
- 두 프로젝트 모두 `App.js`가 있었기 때문에 그대로 복사하면 충돌합니다. 하나의 `App.js`로 라우팅을 합쳤습니다.

## 2. 파일별 역할

| 파일 | 역할 | 이렇게 만든 이유 |
|---|---|---|
| `src/index.js` | React 시작점 | `App.js`를 HTML에 표시합니다. |
| `src/App.js` | 로그인 및 화면 경로 연결 | 메뉴별 기능을 한 파일에 몰아넣지 않기 위해서입니다. |
| `src/admin/AdminLayout.js` | 상단 메뉴, 로그아웃, Outlet | 공통 헤더를 모든 화면에서 반복 작성하지 않기 위해서입니다. |
| `src/admin/pages/Dashboard.js` | 통합 현황 | 프로젝트/이슈/직원/평가 정보를 한눈에 보여줍니다. |
| `src/admin/pages/ProjectManagement.js` | 프로젝트 등록/상세/상태 | 두 번째 ZIP의 기존 업무 흐름을 보존했습니다. |
| `src/admin/pages/ManagerAssignment.js` | 프로젝트 담당자 배정 | 직원 목록을 인사 관리와 공유합니다. |
| `src/components/IssueManagement.js` | 이슈·댓글·마감·상태 | 첫 번째 ZIP의 기능을 유지했습니다. |
| `src/components/HRManagement.js` | 직원·휴가·업무량 | 직원 정보를 다른 화면에서도 재사용합니다. |
| `src/components/EmployeeEvaluation.js` | 평가·승인·이의신청 | 인사 정보와 평가 대상을 연결합니다. |
| `src/components/Login.js` | 시연용 로그인 | MySQL 없이 화면을 확인하기 위해서입니다. 실제 보안은 아닙니다. |
| `src/useErpData.js` | 직원/이슈/평가 데이터 저장 | 여러 화면이 같은 데이터를 보도록 합니다. |
| `src/admin/data/useProjects.js` | 프로젝트 저장 | 기존 프로젝트의 등록·배정 내용이 새로고침 후 유지되게 합니다. |
| `src/initialData.js` | 직원/이슈 샘플 | 최초 실행 때 빈 화면을 피합니다. |
| `src/admin/data/mockData.js` | 프로젝트 샘플 | 기존 프로젝트 예시를 유지합니다. |
| `src/admin/styles/MergedDashboard.css` | 통합 대시보드 디자인 | 기존 CSS를 건드리지 않고 새로운 화면만 꾸밉니다. |
| `src/MergedModules.css` | 이슈/인사/평가 스타일 | 첫 번째 ZIP 스타일을 `merge-erp-module` 아래로 제한해 충돌을 줄입니다. |

## 3. 수정한 문제와 이유

1. **화면 이동 방식 충돌**: `useState`로 화면을 바꾸던 첫 번째 프로젝트를 React Router 경로로 변경했습니다.
2. **직원 데이터 불일치**: 한쪽은 `position`, 다른 쪽은 `role`이었습니다. 담당자 배정 화면에서 `role || position`으로 표시하고 신규 직원은 두 필드를 함께 저장합니다.
3. **데이터 분리**: 프로젝트는 `useProjects.js`, 직원·이슈·평가는 `useErpData.js`로 유지했습니다. 다음 단계에서는 한 저장소로 합치는 것이 좋습니다.
4. **대시보드 중복**: 프로젝트 통계와 이슈/인사/평가 카드를 한 화면에 통합하고 클릭 시 관련 페이지로 이동하게 했습니다.
5. **CSS 충돌**: 이슈·인사·평가 스타일에 접두 영역을 추가하고 통합 대시보드는 `merge-` 클래스를 사용했습니다.
6. **라우트 누락**: 기존 메뉴에만 있던 `/admin/issues`, `/admin/employees`, `/admin/evaluations`를 실제 화면과 연결했습니다.
7. **시연 로그인**: 로그인하지 않은 사용자는 `/login`으로 이동합니다. 단, 프론트엔드만으로는 보안을 보장하지 않습니다.
8. **의존성 정리**: React 18과 React Router 6으로 맞췄습니다. 기존 잠금 파일은 제거하여 설치 시 새로 생성됩니다.

## 4. React 문법 핵심

- `useState`: 입력값, 로그인 여부 등 화면에서 변하는 값을 저장합니다.
- `props`: 부모 `App.js`가 직원/이슈/프로젝트 데이터를 자식 화면으로 전달합니다.
- `map()`: 프로젝트나 이슈 배열을 여러 행으로 출력합니다.
- `filter()`: 진행 중 이슈, 승인 대기 평가만 골라냅니다.
- `useNavigate()`: 카드나 버튼을 클릭했을 때 다른 페이지로 이동합니다.
- `<Outlet />`: 공통 관리자 메뉴 아래에서 현재 선택된 페이지를 표시합니다.
- `localStorage`: 브라우저에 연습 데이터를 저장합니다. DB가 아니고 보안 기능도 아닙니다.

## 5. 앞으로 수정하면 좋은 부분

- `issues`에 `projectId`를 추가해 프로젝트별 이슈 현황 연결
- 프로젝트 변경도 감사 로그에 기록하도록 데이터 관리 함수 통합
- 직원 퇴사 시 담당 프로젝트/이슈의 재배정 안내
- 날짜와 상태 값을 공통 상수로 통일
- 실제 운영 단계에서는 Express 서버, 데이터베이스, 서버 측 인증/권한 검증, 접근 로그 도입

## 6. 실행 오류 점검

- PowerShell에서 `npm`이 막히면 `npm.cmd install`, `npm.cmd start` 사용
- `Module not found`면 ZIP을 압축 해제한 폴더에서 설치했는지 확인
- 이전 프로젝트와 포트 3000이 충돌하면 기존 서버 종료
- 오래된 localStorage가 문제면 `/admin/settings`에서 연습 데이터 초기화
