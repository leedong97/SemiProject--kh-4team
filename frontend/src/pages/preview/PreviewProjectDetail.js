import React from "react";
import { Link, useParams } from "react-router-dom";
import { previewProjects } from "./mockData";

function PreviewProjectDetail() {
    const { id } = useParams();

    const item = previewProjects.find(
        project => project.id === Number(id)
    );

    if (!item) {
        return <h2>프로젝트를 찾을 수 없습니다.</h2>;
    }

    return (
        <section className="preview-card">
            <h2>{item.title}</h2>

            <p>프로젝트 상태 : {item.status}</p>
            <p>우선순위 : {item.priority}</p>
            <p>진행률 : {item.progress}%</p>

            <hr />

            <p>{item.content}</p>

            <Link to="/preview/projects">
                프로젝트 목록으로
            </Link>
        </section>
    );
}

export default PreviewProjectDetail;