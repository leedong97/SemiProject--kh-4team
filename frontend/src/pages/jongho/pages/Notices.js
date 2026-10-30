import React, { useState } from "react";
import { useJunwoo } from "../../junwoo/JunwooContext";
import "./Notices.css";

function Notices() {
    const { info, addInfo, updateInfo, pinInfo, delInfo, noticeLoading, noticeError } = useJunwoo();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [important, setImportant] = useState(false);
    const [employeeId, setEmployeeId] = useState("");
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    function resetForm() {
        setTitle(""); setContent(""); setImportant(false);
        setEmployeeId(""); setEditId(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
        if (editId === null && (!employeeId || !Number.isInteger(Number(employeeId)) || Number(employeeId) <= 0)) {
            return alert("올바른 작성자 직원 번호를 입력해주세요.");
        }
        setSaving(true);
        try {
            if (editId === null) {
                await addInfo(title.trim(), content.trim(), important, Number(employeeId));
                alert("공지사항이 등록되었습니다.");
            } else {
                await updateInfo(editId, title.trim(), content.trim(), important);
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
        setEditId(item.id); setTitle(item.title); setContent(item.content);
        setImportant(Boolean(item.important)); setEmployeeId(String(item.employee_id));
        window.scrollTo(0, 0);
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

    async function handlePin(id) {
        try { await pinInfo(id); } catch (error) { alert(error.message); }
    }

    const filteredInfo = info.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())
    );

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

            <form className="boards-form" onSubmit={handleSubmit}>
                <h2>{editId === null ? "새 공지사항 등록" : "공지사항 수정"}</h2>
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
                {editId === null && (
                    <div className="boards-field">
                        <label htmlFor="notice-employee">작성자 직원 번호 (실제 employees.employee_id)</label>
                        <input id="notice-employee" type="number" min="1" step="1"
                            value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
                    </div>
                )}
                <label className="boards-check">
                    <input type="checkbox" checked={important}
                        onChange={e => setImportant(e.target.checked)} /> 중요 공지사항
                </label>
                <div className="boards-form-actions">
                    {editId !== null && <button type="button" className="boards-btn-cancel" onClick={resetForm}>취소</button>}
                    <button type="submit" className="boards-btn-primary" disabled={saving}>
                        {saving ? "저장 중..." : editId === null ? "등록하기" : "수정 완료"}
                    </button>
                </div>
            </form>

            <div className="boards-list">
                <div className="boards-list-header">
                    <h2>공지사항 목록</h2>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="제목 또는 내용 검색" />
                </div>
                {noticeLoading && <p>공지사항을 불러오는 중...</p>}
                {noticeError && <p role="alert">서버 오류: {noticeError}</p>}
                <div className="boards-table-wrap">
                    <table className="boards-table">
                        <thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>등록일</th><th>관리</th></tr></thead>
                        <tbody>
                            {filteredInfo.length === 0 ? (
                                <tr><td colSpan="5" className="boards-empty">등록된 공지사항이 없습니다.</td></tr>
                            ) : filteredInfo.map(item => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td className="boards-title-cell">
                                        {Boolean(item.important) && <span className="boards-important">중요</span>}
                                        {item.title}
                                    </td>
                                    <td>{item.author}</td><td>{item.date}</td>
                                    <td><div className="boards-actions">
                                        <button type="button" onClick={() => handleEdit(item)}>수정</button>
                                        <button type="button" onClick={() => handlePin(item.id)}>
                                            {item.important ? "고정 해제" : "상단 고정"}
                                        </button>
                                        <button type="button" className="boards-delete" onClick={() => handleDelete(item.id)}>삭제</button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Notices;
