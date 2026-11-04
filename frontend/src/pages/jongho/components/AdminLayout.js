import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getPendingProjectRequests } from "../adminApi";

function AdminLayout({ onLogout }) {

  // 대기 중인 요청(완료 + 등록) 알림
  const [pendingRequests, setPendingRequests] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);

  const loadPendingRequests = async () => {
    try {
      const rows = await getPendingProjectRequests();
      setPendingRequests(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPendingRequests([]);
    }
  };

  useEffect(() => {
    loadPendingRequests();
    const timer = setInterval(loadPendingRequests, 30000);
    return () => clearInterval(timer);
  }, []);

  // 알림 항목을 누르면: 완료 요청은 해당 프로젝트 상세, 등록 요청은 프로젝트 관리 목록
  const openRequest = (req) => {
    setAlertOpen(false);
    if (req.type === "완료" && req.projectId) {
      navigate(`/admin/projects?project=${req.projectId}`);
    } else {
      navigate("/admin/projects");
    }
  };

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
    { name: "데이터 초기화", path: "/admin/settings" }
  ];

  return (
    <div className="nexus-admin-layout">

      {/* 상단 네비게이션 */}
      <header className="nexus-admin-header">

        <div className="nexus-header-top">

          <div className="nexus-logo-area">
            {/* 일반 화면 상단과 같은 로고 이미지 (public/images/command-logo.png) */}
            <img
              className="admin-brand-logo"
              src="/images/command-logo.png"
              alt="COMMAND ERP"
              onClick={() => navigate("/admin")}
            />
            <p className="admin-brand-label">ADMIN WORKSPACE</p>
          </div>

          <div className="nexus-admin-user">
            <div className="admin-alert-wrap">
              <button
                type="button"
                className="btn btn-outline admin-alert-button"
                title="대기 중인 요청"
                onClick={() => { setAlertOpen((prev) => !prev); loadPendingRequests(); }}
              >
                🔔 요청
                {pendingRequests.length > 0 && (
                  <span className="admin-alert-count">{pendingRequests.length}</span>
                )}
              </button>

              {alertOpen && (
                <div className="admin-alert-panel">
                  <div className="admin-alert-head">대기 중인 요청 {pendingRequests.length}건</div>

                  {pendingRequests.length === 0 && (
                    <p className="admin-alert-empty">대기 중인 요청이 없습니다.</p>
                  )}

                  {pendingRequests.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => openRequest(req)}
                    >
                      <span className="admin-alert-type">{req.type === "완료" ? "완료 요청" : "등록 요청"}</span>
                      <strong>{req.type === "완료" ? req.projectName : req.title}</strong>
                      <small>{req.requesterName || "요청자 미상"} · {req.requestedAt}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
