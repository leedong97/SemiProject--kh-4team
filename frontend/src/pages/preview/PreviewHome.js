import React from "react";
import { Link } from "react-router-dom";

function PreviewHome() {
    return (
        <>
            <div className="preview-heading">
                <h1>대시보드</h1>
                <p>COMMAND ERP 시스템 미리보기</p>
            </div>

            <div className="preview-grid">
                <section className="preview-card">
                    <h2>캘린더</h2>
                    <p>일정 및 프로젝트 현황</p>
                </section>

                <div className="preview-right">
                    <section className="preview-card">
                        <h2>공지사항</h2>
                        <Link to="/preview/notices">
                            공지사항 확인하기
                        </Link>
                    </section>

                    <section className="preview-card">
                        <h2>프로젝트</h2>
                        <Link to="/preview/projects">
                            프로젝트 확인하기
                        </Link>
                    </section>
                </div>
            </div>
        </>
    );
}

export default PreviewHome;