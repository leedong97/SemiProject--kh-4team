import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 기존 경로 유지: 테스트용 작성 화면 (실제 운영에서는 관리자 전용 인증 필요)
function Info_set({ onAddInfo }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    async function addInfo() {
        if (!title.trim() || !content.trim()) {
            alert("제목과 내용을 입력해주세요.");
            return;
        }
        if (!employeeId || !Number.isInteger(Number(employeeId)) || Number(employeeId) <= 0) {
            alert("올바른 작성자 직원 번호를 입력해주세요.");
            return;
        }
        setSaving(true);
        try {
            await onAddInfo(title.trim(), content.trim(), false, Number(employeeId));
            alert("공지사항이 등록되었습니다.");
            navigate("/info");
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="info-set-page">
            <h2>공지사항 작성 (개발용)</h2>
            <input type="text" maxLength={200} placeholder="제목 입력" value={title}
                onChange={e => setTitle(e.target.value)} />
            <textarea placeholder="내용 입력" value={content}
                onChange={e => setContent(e.target.value)} />
            <input type="number" min="1" step="1" placeholder="작성자 직원 번호" value={employeeId}
                onChange={e => setEmployeeId(e.target.value)} />
            <button onClick={addInfo} disabled={saving}>{saving ? "등록 중..." : "등록"}</button>
        </div>
    );
}

export default Info_set;
