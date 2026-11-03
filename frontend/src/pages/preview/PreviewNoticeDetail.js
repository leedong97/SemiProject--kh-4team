import React from "react";
import { Link, useParams } from "react-router-dom";
import { previewNotices } from "./mockData";

function PreviewNoticeDetail() {
    const { id } = useParams();

    const item = previewNotices.find(
        notice => notice.id === Number(id)
    );

    if (!item) {
        return <h2>공지사항을 찾을 수 없습니다.</h2>;
    }

    return (
        <section className="preview-card">
            <h2>{item.title}</h2>

            <p>작성자 : {item.author}</p>
            <p>작성일자 : {item.date}</p>

            <hr />

            <p>{item.content}</p>

            <Link to="/preview/notices">
                공지사항 목록으로
            </Link>
        </section>
    );
}

export default PreviewNoticeDetail;