import React from "react";
import { Link } from "react-router-dom";
import { previewProjects } from "./mockData";

function PreviewProjects() {
    return (
        <section className="preview-card">
            <h2>프로젝트 관리</h2>

            {previewProjects.map(item => (
                <div className="preview-list-item" key={item.id}>
                    <Link to={`/preview/projects/${item.id}`}>
                        {item.title}
                    </Link>

                    <span className="preview-tag">{item.status}</span>
                </div>
            ))}
        </section>
    );
}

export default PreviewProjects;