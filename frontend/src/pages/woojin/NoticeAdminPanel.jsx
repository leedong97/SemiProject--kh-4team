import React, { useEffect, useState } from "react";
import "./NoticeAdminPanel.css";

/**
 * 공지사항 관리자용 기능 묶음.
 * 기존 Info.js의 등록 / 상단 고정 / 삭제 기능을 별도 컴포넌트로 옮길 때 사용하는 예시.
 *
 * 데이터/함수는 부모로부터 전달받아 기존 JunwooContext와 재사용할 수 있습니다.
 * 이 컴포넌트는 API를 직접 호출하지 않습니다.
 * initialEventDate: 관리자 캘린더에서 전달받은 YYYY-MM-DD 행사일 (선택)
 */
function NoticeAdminPanel({
  info = [],
  onAddInfo,
  onDeleteInfo,
  onPinInfo,
  onOpenNotice,
  onAfterAdd,
  initialEventDate = ""
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // 관리자 캘린더에서 날짜를 골라 진입했다면 행사일 입력창에 반영
  const [eventDate, setEventDate] = useState(initialEventDate || "");
  useEffect(() => {
    if (initialEventDate) setEventDate(initialEventDate);
  }, [initialEventDate]);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  // 기존 Info.js와 동일하게 상단 고정을 우선하고, 그 안에서 최신 수정순 정렬
  const orderedInfo = [...info].sort((a, b) => {
    const pinnedA = Number(Boolean(a.isPinned));
    const pinnedB = Number(Boolean(b.isPinned));
    if (pinnedA !== pinnedB) return pinnedB - pinnedA;

    return (Number(b.sortAt ?? 0) - Number(a.sortAt ?? 0))
      || (Number(b.id) - Number(a.id));
  });

  const handleAddInfo = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!title.trim()) {
      alert("공지사항 제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("공지사항 내용을 입력해주세요.");
      return;
    }
    if (title.trim().length > 200) {
      alert("제목은 최대 200자까지 입력할 수 있습니다.");
      return;
    }
    if (content.trim().length > 10000) {
      alert("내용은 최대 10000자까지 입력할 수 있습니다.");
      return;
    }

    try {
      setSaving(true);
      const newId = await onAddInfo(title.trim(), content.trim(), eventDate || null);
      setTitle("");
      setContent("");
      setEventDate("");
      // 기존 Info.js는 새 공지사항의 상세 페이지로 이동했습니다.
      // 이동하려면 부모 페이지에서 onAfterAdd(newId)를 전달하세요.
      if (onAfterAdd) onAfterAdd(newId);
      else alert("공지사항이 등록되었습니다.");
    } catch (error) {
      console.error("공지사항 등록 오류:", error);
      alert(error.message || "공지사항 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handlePinInfo = async (id, nextPinned) => {
    if (workingId !== null) return;
    try {
      setWorkingId(id);
      await onPinInfo(id, nextPinned);
      alert(nextPinned ? "공지사항이 상단에 고정되었습니다." : "공지사항 고정이 해제되었습니다.");
    } catch (error) {
      console.error("공지사항 고정 오류:", error);
      alert(error.message || "공지사항 고정 설정에 실패했습니다.");
    } finally {
      setWorkingId(null);
    }
  };

  const handleDeleteInfo = async (id) => {
    if (workingId !== null) return;
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      setWorkingId(id);
      await onDeleteInfo(id);
      alert("공지사항이 삭제되었습니다.");
    } catch (error) {
      console.error("공지사항 삭제 오류:", error);
      alert(error.message || "공지사항 삭제에 실패했습니다.");
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <section className="notice-admin-panel">
      <header className="notice-admin-header">
        <h2>공지사항 관리</h2>
        <span>전체 공지사항 {info.length}건</span>
      </header>

      <section className="notice-admin-register">
        <h3>새로운 공지사항 등록</h3>
        <form className="notice-admin-form" onSubmit={handleAddInfo}>
          <input
            aria-label="공지사항 제목"
            type="text"
            placeholder="공지사항 제목을 입력하세요"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            aria-label="공지사항 내용"
            placeholder="공지사항 내용을 입력하세요"
            maxLength={10000}
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <label htmlFor="notice-admin-event-date">
            행사 날짜 (선택사항)
          </label>
          <input
            id="notice-admin-event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <small>날짜를 지정하면 대시보드 캘린더에 표시됩니다.</small>
          <button type="submit" disabled={saving}>
            {saving ? "등록 중..." : "+ 공지사항 등록"}
          </button>
        </form>
      </section>

      <section className="notice-admin-list">
        <h3>공지사항 목록</h3>
        <div className="notice-admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>공지사항 제목</th>
                <th>작성자</th>
                <th>작성일자</th>
                <th>조회수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {orderedInfo.length === 0 ? (
                <tr>
                  <td colSpan={6}>등록된 공지사항이 없습니다.</td>
                </tr>
              ) : (
                orderedInfo.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      {onOpenNotice ? (
                        <button
                          type="button"
                          className="notice-admin-title-button"
                          onClick={() => onOpenNotice(item.id)}
                        >
                          {Boolean(item.isPinned) && "📌 "}
                          {item.title}
                        </button>
                      ) : (
                        <span>{Boolean(item.isPinned) && "📌 "}{item.title}</span>
                      )}
                    </td>
                    <td>{item.author}</td>
                    <td>{item.date}</td>
                    <td>{item.views ?? 0}</td>
                    <td className="notice-admin-actions">
                      <button
                        type="button"
                        className="notice-admin-pin-button"
                        disabled={workingId !== null}
                        onClick={() => handlePinInfo(item.id, !Boolean(item.isPinned))}
                      >
                        {Boolean(item.isPinned) ? "고정 해제" : "📌 상단 고정"}
                      </button>
                      <button
                        type="button"
                        className="notice-admin-delete-button"
                        disabled={workingId !== null}
                        onClick={() => handleDeleteInfo(item.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default NoticeAdminPanel;
