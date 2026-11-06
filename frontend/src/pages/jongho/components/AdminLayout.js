import React, { useEffect, useState } from "react";
import { PROJECT_STATUS } from "../shared/projectConstants";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { adminRequest, getPendingProjectRequests } from "../adminApi";
import { API_BASE } from "../../../shared/config";
import getLoginUser from "../../woojin/getLoginUser";

function AdminLayout({ onLogout }) {

  // 대기 중인 요청(완료 + 등록) 알림
  const [pendingRequests, setPendingRequests] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false);

  // 상태가 '완료 요청'인 프로젝트 (요청 기록 없이 상태만 바뀐 경우도 알림에 보여준다)
  const [completionProjects, setCompletionProjects] = useState([]);

  // 새 이슈 알림 (읽지 않은 '이슈' 알림, 로그인한 관리자 기준)
  const [issueAlerts, setIssueAlerts] = useState([]);
  // 로그인한 관리자 정보 (로그인 정보가 없으면 더미라서 이름을 보여주지 않는다)
  const me = getLoginUser();
  const adminId = me.id;

  const loadIssueAlerts = async () => {
    if (!adminId) {
      setIssueAlerts([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/notifications?employeeId=${adminId}`);
      const data = await res.json();
      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setIssueAlerts(list.filter((n) => n.type === "이슈" && !n.isRead));
    } catch (err) {
      setIssueAlerts([]);
    }
  };

  const loadPendingRequests = async () => {
    try {
      // 프로젝트 등록은 관리자 페이지에서 직접 하므로 완료 요청만 알림에 보여준다
      const rows = await getPendingProjectRequests('완료');
      setPendingRequests(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPendingRequests([]);
    }
  };

  const loadCompletionProjects = async () => {
    try {
      const rows = await adminRequest('/projects');
      const list = Array.isArray(rows) ? rows : [];
      setCompletionProjects(list.filter((p) => p.status === PROJECT_STATUS.REQUESTED));
    } catch (err) {
      setCompletionProjects([]);
    }
  };

  const loadAlerts = () => {
    loadPendingRequests();
    loadCompletionProjects();
    loadIssueAlerts();
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 30000);
    return () => clearInterval(timer);
  }, []);

  // 알림 항목을 누르면 해당 프로젝트 상세로 이동
  const openRequest = (req) => {
    setAlertOpen(false);
    navigate(`/admin/projects?project=${req.projectId}`);
  };

  const navigate = useNavigate();

  // 이슈 알림을 누르면: 읽음 처리 후 이슈 관리 화면으로 이동
  const openIssueAlert = async (n) => {
    setAlertOpen(false);
    setIssueAlerts((prev) => prev.filter((x) => x.id !== n.id));
    try {
      await fetch(`${API_BASE}/api/notifications/${n.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: adminId }),
      });
    } catch (err) {
      // 읽음 표시 실패는 이동을 막지 않는다
    }
    navigate(n.link || "/admin/issues");
  };

  // 요청 기록이 이미 있는 프로젝트는 위 요청 목록에서 보이므로 중복으로 세지 않는다
  const extraCompletionProjects = completionProjects.filter(
    (p) => !pendingRequests.some((r) => String(r.projectId) === String(p.id))
  );

  const openCompletionProject = (project) => {
    setAlertOpen(false);
    navigate(`/admin/projects?project=${project.id}`);
  };

  const alertTotal = pendingRequests.length + extraCompletionProjects.length + issueAlerts.length;

  // 관리자 상단 메뉴
  const menus = [
    { name: "대시보드", path: "/admin", end: true },
    { name: "프로젝트 관리", path: "/admin/projects" },
    { name: "인원 관리", path: "/admin/members" },
    { name: "이슈 관리", path: "/admin/issues" },
    { name: "인사 관리", path: "/admin/employees" },
    { name: "직원 평가", path: "/admin/evaluations" },
    { name: "공지 관리", path: "/admin/boards" },
    { name: "커뮤니티 관리", path: "/admin/community" },
    { name: "업무량 분석", path: "/admin/workload" },
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

            <div className="admin-alert-wrap">
              <button
                type="button"
                className="btn btn-outline admin-alert-button"
                title="대기 중인 요청"
                onClick={() => { setAlertOpen((prev) => !prev); loadAlerts(); }}
              >
                🔔 요청
                {alertTotal > 0 && (
                  <span className="admin-alert-count">{alertTotal}</span>
                )}
              </button>

              {alertOpen && (
                <div className="admin-alert-panel">
                  <div className="admin-alert-head">알림 {alertTotal}건</div>

                  {alertTotal === 0 && (
                    <p className="admin-alert-empty">새 알림이 없습니다.</p>
                  )}

                  {issueAlerts.map((n) => (
                    <button
                      key={"issue-" + n.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => openIssueAlert(n)}
                    >
                      <span className="admin-alert-type">새 이슈</span>
                      <strong>{n.message}</strong>
                      <small>{n.time}</small>
                    </button>
                  ))}

                  {pendingRequests.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => openRequest(req)}
                    >
                      <span className="admin-alert-type">완료 요청</span>
                      <strong>{req.projectName}</strong>
                      <small>{req.requesterName || "요청자 미상"} · {req.requestedAt}</small>
                    </button>
                  ))}

                  {extraCompletionProjects.map((project) => (
                    <button
                      key={"completion-" + project.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => openCompletionProject(project)}
                    >
                      <span className="admin-alert-type">완료 요청</span>
                      <strong>{project.name}</strong>
                      <small>{project.customer || ""}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!me.isDummy && me.name && (
              <span className="nexus-admin-user-name">{me.name} 님</span>
            )}

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


