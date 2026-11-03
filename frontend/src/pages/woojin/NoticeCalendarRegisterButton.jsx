import React from "react";
import { useNavigate } from "react-router-dom";
import "./NoticeCalendarRegisterButton.css";

/**
 * 관리자 캘린더에서 사용하는 공지사항 등록 버튼.
 * selectedDate: YYYY-MM-DD 형식의 현재 선택 날짜
 * adminNoticePath: 실제 프로젝트에 존재하는 관리자 공지사항 등록 경로
 *
 * 경로는 관리자 담당 팀원이 정해야 하므로 기본값을 만들지 않았습니다.
 * 사용 시 라우트 연결 및 관리자 권한 검사가 반드시 필요합니다.
 */
function NoticeCalendarRegisterButton({ selectedDate, adminNoticePath }) {
  const navigate = useNavigate();

  if (!selectedDate || !adminNoticePath) return null;

  return (
    <button
      type="button"
      className="notice-admin-calendar-register-btn"
      onClick={() => navigate(adminNoticePath, {
        state: { eventDate: selectedDate }
      })}
    >
      + 선택한 날짜로 공지사항 등록
    </button>
  );
}

export default NoticeCalendarRegisterButton;
