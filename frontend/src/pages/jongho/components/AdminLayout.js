import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { API_BASE } from "../../../shared/config";
import getLoginUser from "../../woojin/getLoginUser";
import { useJongho } from "../JonghoContext";

function AdminLayout({ onLogout }) {

  // 대기 중인 요청(완료 + 등록) 알림
  // 요청·프로젝트 목록은 Context가 한 번만 받아 공유한다
  const { completionRequests: pendingRequests = [], refreshAlerts, alertTick } = useJongho() || {};
  const [alertOpen, setAlertOpen] = useState(false);

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

  const loadAlerts = () => {
    refreshAlerts();
    loadIssueAlerts();
  };

  // 30초마다 조회하지 않는다. 변경 신호가 올 때만 다시 받는다
  useEffect(() => {
    loadIssueAlerts();
  }, [alertTick]);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === "visible") loadAlerts();
    };
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, []);

  // 알림 항목을 누르면 해당 프로젝트 상세로 이동
  const openRequest = (req) => {
    setAlertOpen(false);
    navigate(`/admin/projects?project=${req.projectId}`);
  };

  const navigate = useNavigate();
  const location = useLocation();
  // 일반 마이페이지에서 들어온 평가 화면은 다른 관리자 메뉴를 숨깁니다.
  const evaluationOnly = location.pathname === "/admin/evaluations" && new URLSearchParams(location.search).get("from") === "mypage";

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

  // 접수 대기 견적 (Context 에서 받는 실시간 목록)
  const { data: adminData, quotes: allQuotes, reloadAdminData } = useJongho() || {};

  // 관리자 화면에 들어오면 (로그인 직후 포함) 서버 데이터를 한 번 다시 받는다
  useEffect(() => {
    if (reloadAdminData) reloadAdminData();
  }, []);
  const quoteAlerts = (allQuotes || []).filter((q) => q.status === "접수");
  const waitingQuotes = quoteAlerts.length;

  // 이슈 건의: 건의가 저장되면 '검토 중' 상태로 들어온다 (관리자 화면이 받은 이슈 데이터에서 셈)
  const suggestedIssues = ((adminData && adminData.issues) || []).filter((i) => i.status === "검토 중");

  const alertTotal =
    pendingRequests.length + issueAlerts.length +
    suggestedIssues.length + waitingQuotes;

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


  // 메뉴별 화면 제목과 설명은 공통 레이아웃에서 관리한다 (각 화면은 제목을 따로 그리지 않는다)
  const currentMenu = menus.find((menu) => menu.end
    ? location.pathname === menu.path
    : location.pathname === menu.path) || menus[0];
  const pageDescriptions = {
    "/admin": "핵심 운영 지표와 진행 상황을 한눈에 확인합니다.",
    "/admin/projects": "프로젝트 진행 현황, 승인 요청 및 담당자를 관리합니다.",
    "/admin/members": "프로젝트별 참여 인원과 배정 상태를 확인합니다.",
    "/admin/issues": "이슈 진행 상태, 우선순위와 담당 업무를 확인합니다.",
    "/admin/employees": "직원 정보, 인사 현황과 휴가 업무를 관리합니다.",
    "/admin/evaluations": "직원 성과 평가와 승인 현황을 관리합니다.",
    "/admin/boards": "공지사항 등록과 게시 현황을 관리합니다.",
    "/admin/community": "커뮤니티 게시글과 댓글을 관리합니다.",
    "/admin/workload": "업무 배분과 담당자별 업무량을 분석합니다.",
  };

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

                  {suggestedIssues.map((issue) => (
                    <button
                      key={"suggest-" + issue.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => { setAlertOpen(false); navigate("/admin/issues"); }}
                    >
                      <span className="admin-alert-type">이슈 건의</span>
                      <strong>{issue.title}</strong>
                      <small>{issue.projectName || issue.priority || ""}</small>
                    </button>
                  ))}

                  {quoteAlerts.map((q) => (
                    <button
                      key={"quote-" + q.id}
                      type="button"
                      className="admin-alert-item"
                      onClick={() => { setAlertOpen(false); navigate("/admin/projects", { state: { tab: "quotes" } }); }}
                    >
                      <span className="admin-alert-type">견적 요청</span>
                      <strong>{q.company}</strong>
                      <small>{q.service} · {q.createdAt}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* 이름에 마우스를 올리면 서브메뉴(일반 페이지 이동 / 로그아웃)가 열린다 */}
            <div className="nexus-admin-user-menu">
              <button type="button" className="nexus-admin-user-name">
                {me.isDummy || !me.name ? "관리자" : me.name} 님
                <span className="nexus-admin-user-caret" aria-hidden="true">▾</span>
              </button>

              <div className="nexus-admin-user-sub">
                <div className="nexus-admin-user-sub-box">
                  <button
                    type="button"
                    className="nexus-admin-user-sub-item"
                    onClick={() => navigate("/")}
                  >
                    일반 페이지로 이동
                  </button>
                  <button
                    type="button"
                    className="nexus-admin-user-sub-item"
                    onClick={onLogout}
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 관리자 메뉴 */}
        <nav className="nexus-admin-nav">
          {(evaluationOnly ? menus.filter(menu => menu.path === "/admin/evaluations") : menus).map((menu) => (
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
        <div className="nexus-workspace-heading">
          <div>
            <span className="nexus-workspace-breadcrumb">NEXUS ERP / ADMIN</span>
            <h1>{currentMenu.name}</h1>
            <p>{pageDescriptions[currentMenu.path]}</p>
          </div>
        </div>
        <Outlet />
      </main>

    </div>
  );
}

export default AdminLayout;