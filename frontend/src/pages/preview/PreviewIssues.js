import React from "react";
import { Link } from "react-router-dom";
import { previewIssues } from "./mockData";

function PreviewIssues() {
    return (
        <section className="preview-card">
            <h2>이슈관리</h2>

            {previewIssues.map(item => (
                <div className="preview-list-item" key={item.id}>
                    <Link to={`/preview/issues/${item.id}`}>
                        {item.title}
                    </Link>

                    <span className="preview-tag">
                        {item.status}
                    </span>
                </div>
            ))}
        </section>
    );
}

export default PreviewIssues;