import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import "./Preview.css";

function PreviewLayout() {
  return (
    <div className="preview-page">
      <header className="preview-header">
        <NavLink to="/preview">
          <img
            className="preview-logo"
            src="/images/command-logo.png"
            alt="COMMAND ERP"
          />
        </NavLink>

        <nav className="preview-nav">
          <NavLink to="/preview" end>대시보드</NavLink>
          <NavLink to="/preview/projects">프로젝트</NavLink>
          <NavLink to="/preview/issues">이슈관리</NavLink>
          <NavLink to="/preview/notices">공지사항</NavLink>
        </nav>

        <div className="preview-header-actions">
          <span className="preview-user">데모 사용자</span>

          <Link to="/pricing" className="preview-pricing-link">
            <span aria-hidden="true">←</span>
            요금제 보기
          </Link>
        </div>
      </header>

      <main className="preview-content">
        <Outlet />

        <p className="preview-footer">
          COMMAND ERP · 고객 확인용 데모
        </p>
      </main>
    </div>
  );
}

export default PreviewLayout;