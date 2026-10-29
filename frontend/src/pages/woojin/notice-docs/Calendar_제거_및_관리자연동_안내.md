# 캘린더의 공지사항 등록 버튼 — 이관 설명서

## 현재 동작

기존 `frontend/src/pages/junwoo/Calendar.js`의 선택 날짜 화면에는 프로젝트 등록 버튼과 공지사항 등록 버튼이 나란히 있습니다.

```jsx
{/* 공지사항 등록 */}
<button
  type="button"
  className="calendar-add-notice-btn"
  onClick={() => navigate("/info", {
    state: { eventDate: selectedDate }
  })}
>
  + 공지사항 등록
</button>
```

이 버튼은 `selectedDate`(예: `2026-11-05`)를 React Router `location.state.eventDate`로 `/info` 페이지에 전달하며, `Info.js`가 이 값을 받아 행사일 입력창을 채우게 되어 있습니다.

## 나중에 사용자용 Calendar.js에서 제거할 부분

위 **공지사항 버튼 블록만** 제거합니다. `calendar-register-actions`를 감싼 `<div>`나 `selectedDate && (...)` 조건, **프로젝트 등록 버튼**, 일정 목록과 클릭 시 공지사항 상세(`/info/:id`) 이동 로직은 삭제하지 않습니다.

버튼 분리 후 해당 영역은 다음 구조입니다.

```jsx
{selectedDate && (
  <div className="calendar-register-actions">
    <button
      type="button"
      className="calendar-add-project-btn"
      onClick={() => navigate("/todo", {
        state: { startDate: selectedDate }
      })}
    >
      + 프로젝트 등록
    </button>
  </div>
)}
```

스타일은 필요하면 `junwoo.css`의 `.calendar-add-notice-btn` 전용 CSS만 정리하며, 프로젝트 스타일이나 공통 CSS는 건드리지 않습니다.

## 관리자 캘린더에 다시 붙일 때

전달된 `NoticeCalendarRegisterButton.jsx`를 관리 화면의 캘린더 컴포넌트에서 사용하면 됩니다.

```jsx
import NoticeCalendarRegisterButton from "./NoticeCalendarRegisterButton";

// 관리자 화면의 캘린더에서 선택한 날짜가 selectedDate에 들어있다고 가정
<NoticeCalendarRegisterButton
  selectedDate={selectedDate}
  adminNoticePath={actualAdminNoticeRoute}
/>
```

`actualAdminNoticeRoute`에는 **실제로 만들어진 관리자 공지사항 등록 페이지의 경로 문자열**을 전달해야 합니다. 아직 관리자 주소가 확정되지 않았으므로 이관 코드에는 경로를 임의로 지정하지 않았습니다.

관리자 페이지 예시는 `AdminNoticesPage.example.jsx`입니다. 해당 페이지는 `useLocation()`으로 `location.state?.eventDate`를 받아 `NoticeAdminPanel`의 `initialEventDate`로 넘깁니다. `NoticeAdminPanel.jsx`가 날짜 입력창을 초기화합니다.

### 등록부터 일정 확인까지 데이터 흐름

```text
관리자 캘린더에서 날짜 선택
  -> NoticeCalendarRegisterButton.jsx
  -> navigate(실제 관리자 등록 경로, { state: { eventDate: selectedDate } })
  -> AdminNoticesPage.example.jsx / useLocation()
  -> NoticeAdminPanel.jsx / initialEventDate
  -> 기존 onAddInfo(title, content, eventDate)
  -> JunwooContext.js / addInfo()
  -> POST /api/notices
  -> MySQL notices.event_date 저장
  -> GET /api/dashboard/schedules 에서 공지사항 행사 일정 조회
  -> 캘린더에 공지사항 일정 표시
```

## 서버 및 연동 주의사항

- 기존 공지사항 등록 API는 `POST /api/notices`이며 `eventDate`는 `YYYY-MM-DD` 또는 `null`입니다.
- `JunwooContext.js`의 `addInfo`를 관리자 페이지에서 재사용하려면 해당 라우트가 `JunwooProvider` 내부에 있어야 합니다.
- **화면에서 버튼을 제거하는 것만으로 관리자 전용 권한이 생기지 않습니다.** 서버에서 로그인/역할 검사를 추가해야 합니다.
- 기본적으로 행사일이 바뀌어도 공지사항 상세 조회·기존 행사일 표시·캘린더 일정 클릭(`noticeId`로 상세 이동)은 유지합니다.
- `Info.js`에서 등록 폼을 이관할 경우 `/info`로 가던 캘린더 경로를 그대로 두지 말고, 관리자 등록 경로로 옮겨야 합니다.
- 현재 원본 프로젝트 코드를 자동 수정한 것이 아닙니다. 팀원과 이관 일정 확정 후 제거하세요.
