import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useJunwoo } from "../../junwoo/JunwooContext";
import getLoginUser from "../../woojin/getLoginUser";
import { adminRequest } from "../adminApi";
import useSortableList from "../utils/useSortableList";
import usePagination from "../utils/usePagination";
import NumberedPager from "../components/NumberedPager";

const PAGE_SIZE = 10;

// "2026.11.05" 형식의 날짜를 Date로 바꾼다 (기간 필터용)
function parseNoticeDate(text) {
    if (!text) return null;
    const d = new Date(String(text).replace(/\./g, "-"));
    return Number.isNaN(d.getTime()) ? null : d;
}

function Notices() {
    const { info, addInfo, updateInfo, pinInfo, delInfo, noticeLoading, noticeError } = useJunwoo();
    const me = getLoginUser();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const [pinnedOnly, setPinnedOnly] = useState(false);
    const [period, setPeriod] = useState("all");
    const [saving, setSaving] = useState(false);
    // 고정 여부 (작성·수정 폼의 체크박스)
    const [pinned, setPinned] = useState(false);
    const [originalPinned, setOriginalPinned] = useState(false);
    // 행사일 (달력에 표시됨, 비워 두면 없음)
    const [eventDate, setEventDate] = useState("");
    // 수정할 때 기존 행사일을 불러왔는지 (못 불러오면 저장을 막아 기존 값이 지워지지 않게 한다)
    const [eventDateLoaded, setEventDateLoaded] = useState(true);
    const [eventDateError, setEventDateError] = useState("");
    // 행사일 조회 요청 번호 (늦게 도착한 옛 응답이 새 공지 폼을 덮지 않도록)
    const eventDateRequestRef = useRef(0);
    // 작성 폼 열림 여부 (평소에는 숨기고, '새 공지 작성' 또는 수정을 눌렀을 때만 연다)
    const [formOpen, setFormOpen] = useState(false);

    // 대시보드에서 ?notice=번호 로 넘어오면 해당 공지를 수정 폼에 채움
    const [searchParams] = useSearchParams();
    const focusNoticeId = searchParams.get("notice");
    const openedNoticeRef = useRef(null);

    // 새 공지 작성 폼 열기 (입력 중이던 내용은 비운다)
    function openNewForm() {
        resetForm();
        setFormOpen(true);
    }

    function resetForm() {
        setFormOpen(false);
        setTitle(""); setContent(""); setEditId(null);
        setPinned(false); setOriginalPinned(false);
        setEventDate(""); setEventDateLoaded(true); setEventDateError("");
        eventDateRequestRef.current += 1;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
        if (editId !== null && !eventDateLoaded) return alert("행사일을 불러온 뒤에 저장할 수 있습니다.");
        const eventDateValue = eventDate || null;
        setSaving(true);
        try {
            if (editId === null) {
                // 등록 후 새 공지 번호로 고정을 건다 (체크한 경우에만)
                const newId = await addInfo(title.trim(), content.trim(), eventDateValue);
                if (pinned && newId != null) await pinInfo(newId, true);
                alert("공지사항이 등록되었습니다.");
            } else {
                await updateInfo(editId, title.trim(), content.trim(), eventDateValue);
                // 고정 상태가 처음과 달라졌을 때만 바꾼다
                if (pinned !== originalPinned) await pinInfo(editId, pinned);
                alert("공지사항이 수정되었습니다.");
            }
            resetForm();
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(item) {
        setFormOpen(true);
        setEditId(item.id); setTitle(item.title); setContent(item.content);
        setPinned(Boolean(item.isPinned)); setOriginalPinned(Boolean(item.isPinned));
        loadEventDate(item.id);
        window.scrollTo(0, 0);
    }

    // 기존 행사일을 서버에서 가져와 폼에 채운다 (실패하면 폼 안에 사유를 보여주고 다시 불러올 수 있다)
    function loadEventDate(noticeId) {
        const requestId = eventDateRequestRef.current + 1;
        eventDateRequestRef.current = requestId;
        setEventDate(""); setEventDateLoaded(false); setEventDateError("");
        adminRequest(`/notices/${noticeId}/event-date`)
            .then((data) => {
                if (requestId !== eventDateRequestRef.current) return;
                setEventDate(data.eventDate || ""); setEventDateLoaded(true);
            })
            .catch((error) => {
                if (requestId !== eventDateRequestRef.current) return;
                setEventDateError(error.message || "행사일을 불러오지 못했습니다.");
            });
    }

    async function handleDelete(id) {
        if (!window.confirm("공지사항을 삭제하시겠습니까?")) return;
        try {
            await delInfo(id);
            if (editId === id) resetForm();
        } catch (error) {
            alert(error.message);
        }
    }

    // 고정 / 고정 해제 (서버에 보내는 값은 바뀐 상태)
    async function handlePin(item) {
        try {
            await pinInfo(item.id, !item.isPinned);
        } catch (error) {
            alert(error.message);
        }
    }

    // 대시보드에서 넘어온 공지를 찾아 수정 폼에 바로 채움 (같은 공지는 한 번만)
    useEffect(() => {
        if (!focusNoticeId || openedNoticeRef.current === focusNoticeId) return;
        const target = info.find(item => String(item.id) === focusNoticeId);
        if (!target) return;
        openedNoticeRef.current = focusNoticeId;
        handleEdit(target);
    }, [focusNoticeId, info]);

    // 열별 정렬 값 (날짜는 숫자로 바꿔서 비교)
    const getSortValue = (item, key) => {
        if (key === "id") return Number(item.id);
        if (key === "title") return String(item.title || "");
        if (key === "author") return String(item.author || "");
        if (key === "date") {
            const d = parseNoticeDate(item.date);
            return d ? d.getTime() : 0;
        }
        if (key === "views") return Number(item.views) || 0;
        return "";
    };
    const { sortKey, changeSort, sortItems, sortMark } = useSortableList(getSortValue);

    // 필터 → 검색 → 정렬 → 고정 공지를 맨 위로
    const filteredInfo = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        const now = new Date();
        const days = period === "7" ? 7 : period === "30" ? 30 : null;

        const matched = info
            .filter(item => !pinnedOnly || item.isPinned)
            .filter(item => {
                if (days === null) return true;
                const d = parseNoticeDate(item.date);
                if (!d) return false;
                return (now - d) / 86400000 <= days;
            })
            .filter(item =>
                !keyword ||
                String(item.title || "").toLowerCase().includes(keyword) ||
                String(item.content || "").toLowerCase().includes(keyword)
            );

        // 정렬을 고르지 않았으면 등록 순서(오래된 순, 번호 작은 것부터)
        const ordered = sortKey
            ? sortItems(matched)
            : [...matched].sort((a, b) => Number(a.id) - Number(b.id));

        // 고정 공지는 정렬과 상관없이 항상 위
        return [
            ...ordered.filter(item => item.isPinned),
            ...ordered.filter(item => !item.isPinned),
        ];
    }, [info, search, pinnedOnly, period, sortKey, sortItems]);

    // 번호는 화면 순서대로 1부터 이어서 매긴다 (위에서 아래로 1, 2, 3 ...)
    const numbered = useMemo(
        () => {
            // 고정 공지는 번호 대신 '고정', 나머지는 고정 공지를 빼고 1부터 센다
            let no = 0;
            return filteredInfo.map((item) => ({
                ...item,
                displayNo: item.isPinned ? "고정" : ++no,
            }));
        },
        [filteredInfo]
    );

    const { pageItems, currentPage, totalPages, total, goTo } =
        usePagination(numbered, PAGE_SIZE, [search, pinnedOnly, period, sortKey]);

    return (
        <div className="admin-boards">
            <div className="boards-header">
                <div>
                    <span className="boards-label">WORKSPACE / NOTICE</span>
                    <h1>공지사항 관리</h1>
                    <p>MySQL 데이터베이스와 연결된 공지사항 관리</p>
                </div>
                <div className="boards-count">전체 공지사항<strong>{info.length}건</strong></div>
            </div>

            {!formOpen && (
                <div className="nexus-notice-form-toggle">
                    <button type="button" className="btn btn-primary" onClick={openNewForm}>
                        + 새 공지 작성
                    </button>
                </div>
            )}

            {formOpen && (
            <form className="boards-form" onSubmit={handleSubmit}>
                <h2>{editId === null ? "새 공지사항 등록" : "공지사항 수정"}</h2>
                {editId === null && (
                    <p>작성자: {me.isDummy ? "로그인 후 등록할 수 있습니다" : `${me.name || ""} 님`}</p>
                )}
                <div className="boards-field">
                    <label htmlFor="notice-title">제목</label>
                    <input id="notice-title" maxLength={200} value={title}
                        onChange={e => setTitle(e.target.value)} placeholder="제목 입력" />
                </div>
                <div className="boards-field">
                    <label htmlFor="notice-content">내용</label>
                    <textarea id="notice-content" rows={6} value={content}
                        onChange={e => setContent(e.target.value)} placeholder="내용 입력" />
                </div>
                <div className="boards-field">
                    <label htmlFor="notice-event-date">행사일 (선택)</label>
                    <input id="notice-event-date" type="date" value={eventDate}
                        onChange={e => setEventDate(e.target.value)} />
                    {editId !== null && !eventDateLoaded && !eventDateError && (
                        <small>행사일을 불러오는 중...</small>
                    )}
                    {eventDateError && (
                        <small role="alert" className="nexus-notice-event-date-error">
                            {eventDateError}{" "}
                            <button type="button" onClick={() => loadEventDate(editId)}>다시 불러오기</button>
                        </small>
                    )}
                </div>
                <label className="boards-check">
                    <input type="checkbox" checked={pinned}
                        onChange={e => setPinned(e.target.checked)} /> 상단 고정 공지로 {editId === null ? "등록" : "설정"}
                </label>
                <div className="boards-form-actions">
                    <button type="button" className="boards-btn-cancel" onClick={resetForm}>취소</button>
                    <button type="submit" className="boards-btn-primary" disabled={saving}>
                        {saving ? "저장 중..." : editId === null ? "등록하기" : "수정 완료"}
                    </button>
                </div>
            </form>
            )}

            <div className="boards-list">
                <div className="boards-list-header">
                    <h2>공지사항 목록</h2>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목 또는 내용 검색" />
                </div>

                <div className="boards-filters nexus-notice-filters">
                    <label>
                        <input type="checkbox" checked={pinnedOnly}
                            onChange={e => setPinnedOnly(e.target.checked)} /> 고정 공지만
                    </label>
                    <select value={period} onChange={e => setPeriod(e.target.value)}>
                        <option value="all">전체 기간</option>
                        <option value="7">최근 7일</option>
                        <option value="30">최근 30일</option>
                    </select>
                    <span>검색 결과 {filteredInfo.length}건</span>
                </div>

                {noticeLoading && <p>공지사항을 불러오는 중...</p>}
                {noticeError && <p role="alert">서버 오류: {noticeError}</p>}
                <div className="boards-table-wrap">
                    <table className="boards-table">
                        <thead>
                            <tr>
                                <th className="is-sortable" onClick={() => changeSort("id")}>번호{sortMark("id")}</th>
                                <th className="is-sortable" onClick={() => changeSort("title")}>제목{sortMark("title")}</th>
                                <th className="is-sortable" onClick={() => changeSort("author")}>작성자{sortMark("author")}</th>
                                <th className="is-sortable" onClick={() => changeSort("date")}>등록일{sortMark("date")}</th>
                                <th className="is-sortable" onClick={() => changeSort("views")}>조회{sortMark("views")}</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length === 0 ? (
                                <tr><td colSpan="6" className="boards-empty">등록된 공지사항이 없습니다.</td></tr>
                            ) : pageItems.map(item => (
                                <tr key={item.id}>
                                    <td>{item.displayNo}</td>
                                    <td className="boards-title-cell">
                                        {Boolean(item.isPinned) && <span className="boards-important">고정</span>}
                                        {item.title}
                                    </td>
                                    <td>{item.author}</td>
                                    <td>{item.date}</td>
                                    <td>{item.views ?? 0}</td>
                                    <td><div className="boards-actions">
                                        <button type="button" onClick={() => handleEdit(item)}>수정</button>
                                        <button type="button" onClick={() => handlePin(item)}>
                                            {item.isPinned ? "고정 해제" : "상단 고정"}
                                        </button>
                                        <button type="button" className="boards-delete" onClick={() => handleDelete(item.id)}>삭제</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <NumberedPager currentPage={currentPage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPage={goTo} />
            </div>
        </div>
    );
}

export default Notices;