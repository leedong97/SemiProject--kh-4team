# COMAND ERP 공지사항 관리 기능 이관 안내

> 대상: 공지사항 관리자 화면 개발 담당 팀원
> 기준: 기존 `src/pages/junwoo/Info.js`, `JunwooContext.js`, Express `server.js`
> 목적: 사용자용 공지사항 페이지에는 **제목 검색 + 조회 목록 + 상세 이동 + 페이지네이션**을 남기고, **공지사항 등록·고정·삭제**를 관리자 페이지로 옮기기
> 주의: 원본 프로젝트 파일은 수정하지 않았으며, 이 폴더는 팀원에게 전달하는 독립 예시 코드입니다.

## 1. 화면별 이관 범위

| 화면에 보이는 부분 | 현재 위치 | 향후 위치 |
| --- | --- | --- |
| `공지사항 관리` 제목 및 관리 설명 | `Info.js` `.info-manage-header` | 관리 페이지에서 필요에 맞게 재구성 |
| `검색 리셋` 버튼 | `Info.js` `.info-reset` | 일반 페이지에서 제거할 수 있으나 검색어 초기화 수단은 검토 |
| `전체 공지사항 n건 / 조회된 공지사항 n건` | `Info.js` `.info-summary` | 사용자 페이지에서 제외, 관리자 페이지에서 선택적으로 활용 |
| **공지사항 제목 검색** | `Info.js` `.info-filter` | **일반 공지사항 페이지에 유지** |
| `새로운 공지사항 등록` (제목·내용·행사일·등록 버튼) | `Info.js` `.info-register` / `.info-register-form` | **관리자 페이지로 이관** |
| 공지사항 목록 (번호·제목·작성자·작성일·조회수) | `Info.js` `.info-list-section` | **일반 공지사항 페이지에 유지** |
| 목록의 `관리` 열 (`📌 상단 고정/고정 해제`, `삭제`) | `Info.js` `.info-table`의 마지막 `th`와 `td` | **관리자 페이지로 이관** |
| 페이지네이션 | `Info.js` `.info-pages` | **일반 공지사항 페이지에 유지** |
| 제목 클릭 시 `/info/:id` 상세 이동 | `Info.js` `.info-title-link` | **일반 공지사항 페이지에 유지** |
| 중요 공지 표시/정렬 | `Info.js` `filteredInfo`와 제목 핀 아이콘 | 관리 버튼을 빼더라도 **일반 공지사항 페이지에 유지 가능** |

**검색 리셋과 전체 건수는 검색 기능 자체가 아닙니다.** 사용자 요청에 따라 화면에서 빼도 되지만 검색 조건과 페이지 상태를 다루는 React state까지 무작정 삭제하지 마세요.

## 2. 전달 파일

- `NoticeAdminPanel.jsx`: 현재 `Info.js`의 등록 / 중요 공지 고정 / 해제 / 삭제 기능을 **관리자용 컴포넌트로 재구성한 예시**.
- `NoticeAdminPanel.css`: 위 컴포넌트용으로 범위를 좁힌 스타일. 기존 `junwoo.css` 전체를 복사하지 않아도 됩니다.
- 이 문서: 원래 코드 위치, 함수 연결, API 명세, 통합 주의사항.

두 파일은 실제 팀 프로젝트를 자동 변경하지 않습니다. 해당 팀원이 자신의 관리자 페이지 구조에 맞춰 import/경로를 조정하여 사용할 수 있습니다.

## 3. 기존 코드의 기능 연결

현재 `Info.js`에서 사용하는 함수들은 다음과 같습니다.

### 등록
- React state: `title`, `content`, `eventDate`
- 이벤트 함수: `handleAddInfo`
- 호출: `await onAddInfo(title.trim(), content.trim(), eventDate || null)`
- 기존 동작: 성공하면 입력 초기화 후 `navigate(`/info/${newId}`)`
- 기본 입력 조건: 제목·내용 필수, `eventDate` 선택
- 서버는 제목 200자, 내용 10,000자 제한을 검증하며, 행사일은 `YYYY-MM-DD` 또는 `null`입니다.

### 상단 고정 / 고정 해제
- 이벤트 함수: `handlePinInfo(id, isPinned)`
- 호출: `await pinInfo(id, !Boolean(item.isPinned))`
- UI 레이블: `📌 상단 고정` 또는 `고정 해제`
- 중요 공지는 `isPinned`로 구별하며, 사용자용 목록에서 계속 위에 노출되도록 정렬 규칙을 유지할 수 있습니다.

### 삭제
- 이벤트 함수: `handleDeleteInfo(id)`
- 확인: `window.confirm('정말 삭제하시겠습니까?')`
- 호출: `await delInfo(id)`
- 성공 시 Context의 `info` 배열이 갱신되어야 화면에서도 사라집니다.

### 목록
- 데이터: `info` 배열
- 주요 필드: `id`, `title`, `content`, `author`, `date`, `views`, `isPinned`, `sortAt`(최신 수정순이 적용된 환경)
- 기존 일반 페이지: 제목 검색 후 중요 공지 우선·최근 수정순 정렬, 10개씩 페이지네이션
- 관리용 예시: 검색 기능은 제외하고 고정·삭제가 가능한 테이블로 구성했습니다.

## 4. 관리자 페이지 연결 예시

관리 페이지가 기존 **JunwooProvider 내부에 렌더링되는 경우**에는 기존 Context 함수를 재사용할 수 있습니다.

```jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import NoticeAdminPanel from "./NoticeAdminPanel";
// 아래 경로는 관리자 페이지의 파일 위치에 맞게 조정하세요.
import { useJunwoo } from "../junwoo/JunwooContext";

function AdminNoticesPage() {
  const { info, addInfo, delInfo, pinInfo } = useJunwoo();
  const navigate = useNavigate();

  return (
    <NoticeAdminPanel
      info={info}
      onAddInfo={addInfo}
      onDeleteInfo={delInfo}
      onPinInfo={pinInfo}
      onOpenNotice={(id) => navigate(`/info/${id}`)}
      onAfterAdd={(id) => navigate(`/info/${id}`)}
    />
  );
}

export default AdminNoticesPage;
```

- **중요**: 관리자 페이지의 경로가 `JunwooProvider` 밖이라면 `useJunwoo()`가 `null`일 수 있습니다. 이 경우 Provider 배치 또는 별도 API/상태 연동을 팀에서 정해야 합니다.
- 여기서 `onAfterAdd`는 기존처럼 등록 직후 공지사항 상세로 이동하는 **선택적 동작**입니다. 관리자 화면에 남게 하려면 전달하지 않아도 됩니다.
- 관리자 페이지 URL 및 공통 사이드바 권한 메뉴 연결은 팀의 라우트 구조에 맞게 별도로 결정합니다.

## 5. 현재 Express 서버에 구현된 API

| 기능 | Method | URL | 요청 body 예시 |
| --- | --- | --- | --- |
| 공지사항 목록 | `GET` | `/api/notices` | 없음 |
| 공지사항 등록 | `POST` | `/api/notices` | `{"title":"제목","content":"내용","employee_id":1,"eventDate":"2026-11-05"}` |
| 공지사항 고정/해제 | `PATCH` | `/api/notices/:id/pin` | `{"isPinned":true}` 또는 `false` |
| 공지사항 삭제 | `DELETE` | `/api/notices/:id` | 없음 |
| 상세 조회 | `GET` | `/api/notices/:id` | 없음 |
| 상세 수정 | `PUT` | `/api/notices/:id` | `{"title":"제목","content":"내용","eventDate":"2026-11-05"}` |

현재 등록 경로에서 작성자 사원번호는 프런트에서 임시 값 1을 전달하도록 연결되어 있습니다. **실제 로그인 사원 정보 연동 후 변경**해야 합니다. DB는 기존 `notices` 테이블을 계속 사용합니다.

**중요: 지금 서버 API에 관리자 인증/권한 검사가 있다고 확인된 상태가 아닙니다.** 단순히 버튼을 관리자 페이지로 옮기는 것만으로 수정/삭제가 관리자 전용이 되는 것은 아닙니다. 담당 팀원은 로그인 세션 또는 토큰에 따른 **서버 권한 검사**까지 연결해야 합니다.

## 6. 실제 이관 시 기존 공지사항 페이지에서 주의할 점 (지금은 수정하지 말 것)

1. 사용자 `Info.js`에 `info-filter` 제목 검색, `info-list-section` 목록, 페이지네이션, 상세 이동을 유지.
2. `info-register` 섹션과 등록에만 쓰던 state·함수는 관리자 페이지 이관 후에 정리.
3. `info-table`에서 마지막 `관리` 헤더와 고정·삭제 `td`를 제거할 경우 빈 목록 `colSpan={6}`을 **`colSpan={5}`로 변경**.
4. 고정/삭제 버튼을 제거하더라도 `item.isPinned`에 따른 📌 표시와 상단 고정 정렬은 남겨둘 수 있습니다.
5. 사용자용 검색에 필요한 `search`, `pages`, `filteredInfo`를 함께 삭제하면 검색/페이지네이션이 고장납니다.
6. **캘린더 연결 주의:** 현재 `Calendar.js`의 `+ 공지사항 등록` 버튼은 `/info`로 이동하며 `state: { eventDate: selectedDate }`를 전달합니다. 등록 폼이 관리자 페이지로 이동하면 해당 버튼도 등록 폼이 있는 **새 관리자 경로**로 연결하거나, 별도의 등록 화면을 마련해야 합니다. 선택 날짜 자동 입력 구현도 새 화면에서 받아야 합니다.
7. `JunwooContext.js`의 공통 `addInfo`, `delInfo`, `pinInfo`나 서버 API를 먼저 삭제하지 마세요. 관리자 기능과 캘린더 연동에서 계속 사용합니다.
8. 기존 스타일인 `junwoo.css`는 프로젝트·캘린더·공지사항에 걸친 공통 선택자가 있으므로, UI 삭제만을 이유로 관련 CSS를 통째로 지우지 마세요.

## 7. 팀원에게 전달할 한 줄 요청

> "현재 사용자 공지사항 페이지에서 **공지사항 제목 검색/목록/상세/페이지네이션은 유지**하고, **등록 폼(행사일 포함), 중요 공지 고정/해제, 삭제 버튼**을 관리자 공지사항 화면으로 이관해야 합니다. 기존 MySQL `notices`와 Express API를 재사용하고, 로그인/관리자 권한 검사는 백엔드까지 적용해 주세요. 이 파일은 원본 소스 변경 전 전달하는 추출 예시입니다."
