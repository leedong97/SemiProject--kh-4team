import React from "react";
import { Link } from "react-router-dom";
import { previewNotices } from "./mockData";

function PreviewNotices() {
    return (
        <section className="preview-card">
            <h2>공지사항</h2>

            {previewNotices.map(item => (
                <div className="preview-list-item" key={item.id}>
                    <Link to={`/preview/notices/${item.id}`}>
                        {item.title}
                    </Link>

                    <span>{item.date}</span>
                </div>
            ))}
        </section>
    );
}

export default PreviewNotices;