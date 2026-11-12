# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary (confirmed focus): 직원(사원)** — 회사 내부에서 COMMAND ERP에 로그인해 하루 업무를 처리하는 사람. 대시보드에서 일정·공지를 확인하고, 프로젝트와 이슈를 진행하고, 사내 커뮤니티에서 소통한다.
- **관리자** — `role = '관리자'` 계정. `/admin` 에서 프로젝트·구성원·이슈·인사·평가·게시판·커뮤니티·업무량을 관리한다.
- **포트폴리오 평가자 (confirmed)** — 이 프로젝트는 포트폴리오로 보여줄 결과물이다. 채용 담당자·면접관 등이 시연 화면이나 스크린샷으로 완성도를 판단한다.

## Product Purpose

COMMAND ERP는 사내 업무(일정, 공지, 프로젝트, 이슈, 인사, 커뮤니티)를 한 화면 체계로 모은 직원용 ERP 웹앱이다. 이번 디자인 작업의 주 대상은 직원용 ERP 화면(`frontend/`)이다.

성공 기준: 직원이 대시보드에서 오늘 할 일을 바로 파악하고 각 메뉴로 막힘 없이 이동할 수 있으며, 포트폴리오로 보여줬을 때 실제 서비스 수준의 완성도로 읽히는 것.

## Positioning

여러 팀원이 각자 맡은 기능(로그인·마이페이지·일정 / 대시보드·공지·프로젝트·커뮤니티 / 이슈 / 인사·평가 / 관리자)을 하나의 공통 틀(TeamShell)과 하나의 서버로 통합한 ERP다. 같은 회사의 고객용 사이트(NEXUS SOLUTIONS, `frontend_ecommerce/`)와 요금제 페이지(`/pricing`)도 있지만 이번 범위의 중심은 아니다.

## Operating Context

- 데스크톱 브라우저에서 근무 시간 내내 열어 두고 쓰는 업무 도구. 알림 수는 3초마다 갱신된다.
- 진입: `/login` → 로그인 후 `/`(대시보드). 상단 메뉴: 대시보드 · 프로젝트(`/todo`) · 이슈(`/issue`) · 공지(`/info`) · 커뮤니티(`/community`) · 이름/마이페이지 · 로그아웃. 관리자는 `/admin` 하위 화면.
- 로그인 없이 볼 수 있는 고객 확인용 데모: `/preview` (목업 데이터).
- 실행: React(CRA) 3000 포트, Express 서버 3333 포트, PostgreSQL. `start-all.bat`.

## Capabilities and Constraints

- Stack: React 19 + react-router-dom 7 (Create React App), axios, Express, PostgreSQL. 고객 사이트는 별도 Vite 앱.
- CSS는 팀원별 폴더(`frontend/src/pages/<이름>/`)에 흩어져 있고, 공통 틀은 `frontend/src/shared/shell.css` 와 `TeamShell.js`. 공통 틀을 바꾸면 모든 화면이 바뀐다 (코드 주석: 바꾸기 전에 팀에 알릴 것).
- 디자인 변경 시 지켜야 할 제약은 따로 없다고 확인됨 (팀원별 CSS 구조·로고·현재 색상 모두 변경 가능).
- 관리자 API는 개발용으로 로그인 검사가 없다(README). 디자인 범위 밖이지만 공개 시 주의.
- 용어: 메뉴의 "프로젝트"는 경로 `/todo`, "공지"는 `/info` 를 쓴다.

## Brand Commitments

- 제품 이름 **COMMAND ERP**, 로고 이미지 `frontend/public/images/command-logo.png`. 변경 금지로 지정된 것은 아니다.

## Evidence on Hand

- 실제 동작하는 화면과 API, SQL 마이그레이션(`sql/`), 데모용 목업 데이터(`frontend/src/pages/preview/mockData.js`).
- 실제 고객사·사용자 후기·사용 통계는 없다. 디자인 작업에서 이를 지어내지 않는다.

## Product Principles

1. 업무 도구가 먼저다: 화려함보다 정보를 빨리 찾고 처리하는 흐름이 우선이다.
2. 여러 팀원의 화면이 하나의 제품처럼 보여야 한다: 공통 틀과 공통 규칙으로 일관성을 만든다.
3. 포트폴리오 수준의 완성도: 빈 상태, 오류, 로딩까지 실제 서비스처럼 다듬는다.
4. 확인되지 않은 수치나 실적은 화면에 넣지 않는다.
