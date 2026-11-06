import React from "react";
import { Link, useParams } from "react-router-dom";
import { previewIssues } from "./mockData";

function PreviewIssuesDetail() {

    const { id } = useParams();

    const item = previewIssues.find(
        issue => issue.id === Number(id)
    );

    if (!item) {
        return (
            <section className="preview-card">
                <h2>이슈를 찾을 수 없습니다.</h2>
                <Link to="/preview/issues">
                    ← 이슈 목록으로
                </Link>
            </section>
        );
    }

    return (

        <section className="preview-card">
            <h2>{item.title}</h2>

            <p>
                처리상태 :{" "}
                <span className="preview-tag">{item.status}</span>
            </p>
            <p>우선순위 : {item.priority}</p>
            <p>담당자 : {item.author}</p>
            <p>등록일 : {item.date}</p>

            <hr />

            <h3>이슈 내용</h3>
            <p>{item.content}</p>

            <h3>처리 현황</h3>
            <p>{item.progressNote}</p>

            <Link className="demo-more-link" to="/preview/issues">
                ← 이슈 목록으로
            </Link>
        </section>

    );

}

export default PreviewIssuesDetail;