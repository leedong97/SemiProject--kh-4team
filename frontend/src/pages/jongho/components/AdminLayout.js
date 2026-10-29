import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

function AdminLayout({ onLogout }) {

  const navigate = useNavigate();

  // 관리자 상단 메뉴
  const menus = [
    { name: "대시보드", path: "/admin", end: true },
    { name: "프로젝트 관리", path: "/admin/projects" },
    { name: "담당자 배정", path: "/admin/assignments" },
    { name: "이슈 관리", path: "/admin/issues" },
    { name: "인사 관리", path: "/admin/employees" },
    { name: "직원 평가", path: "/admin/evaluations" },
    { name: "공지 관리", path: "/admin/boards" },
    { name: "업무량 분석", path: "/admin/workload" },
    { name: "감사 로그", path: "/admin/audit" },
    { name: "데이터 초기화", path: "/admin/settings" }
  ];

  return (
    <div className="nexus-admin-layout">

      {/* 상단 네비게이션 */}
      <header className="nexus-admin-header">

        <div className="nexus-header-top">

          <div className="nexus-logo-area">
            <div className="nexus-logo">N</div>

            <div>
              <h2>NEXUS ERP</h2>
              <p>ADMIN WORKSPACE</p>
            </div>
          </div>

          <div className="nexus-admin-user">
            <span className="badge badge-outline"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              title="일반 페이지로 이동"
              onClick={() => navigate("/")}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("/"); }}
            >
              일반 페이지로 이동
            </span>

            <button className="btn btn-outline" type="button" onClick={onLogout}>
              로그아웃
            </button>

          </div>

        </div>

        {/* 관리자 메뉴 */}
        <nav className="nexus-admin-nav">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.end}
              className={({ isActive }) =>
                isActive
                  ? "nexus-nav-item active"
                  : "nexus-nav-item"
              }
            >
              {menu.name}
            </NavLink>
          ))}
        </nav>

      </header>

      {/* 선택한 메뉴의 컴포넌트 표시 */}
      <main className="nexus-admin-main">
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;