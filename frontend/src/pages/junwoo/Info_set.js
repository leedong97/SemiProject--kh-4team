
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Info_set({ onAddInfo }) {

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const navigate = useNavigate();

    const addInfo = () => {

        if (!title.trim()) {
            alert('공지사항 제목을 입력하세요.');
            return;
        } else if (!content.trim()) {
            alert('공지사항 내용을 입력하세요.');
            return;
        } else {

            onAddInfo(title.trim(), content.trim());
            navigate('/info');
        }
    };

    return (
        <div className="info-set-page">
            <h2>공지사항 작성</h2>

            <input
                type="text"
                placeholder="제목 입력"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
                placeholder="내용 입력"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <button onClick={addInfo}>
                등록
            </button>
        </div>
    );
}

export default Info_set;
