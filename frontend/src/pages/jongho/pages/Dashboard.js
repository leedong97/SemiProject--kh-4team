import { PROJECT_STATUS } from "../shared/projectConstants";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardPanel from "../components/DashboardPanel";
import { adminRequest } from "../adminApi";
import { API_BASE } from "../../../shared/config";

// 프로젝트 + 이슈 + 인사 + 평가를 하나의 화면에서 보여줍니다.
export default function Dashboard({ projects = [], data }) {
    const navigate = useNavigate();
    const today = new Date().toLocaleDateString("en-CA");
    const openIssues = data.issues.filter(issue => issue.status !== "완료");
    const overdue = openIssues.filter(issue => issue.due && issue.due < today);
    const pending = data.evaluations.filter(item => item.status === "승인 요청");
    const unassigned = projects.filter(project => project.managerId == null);
    const active = projects.filter(project => [PROJECT_STATUS.IN_PROGRESS, "진행 중"].includes(project.status));
    const cards = [
        { title: "전체 프로젝트", value: projects.length, detail: `진행 중 ${active.length}개`, path: "/admin/projects", icon: "▣" },
        { title: "미완료 이슈", value: openIssues.length, detail: `기한 초과 ${overdue.length}건`, path: "/admin/issues", icon: "◈" },
        { title: "재직 직원", value: data.employees.filter(e => e.status === "재직").length, detail: "인사 정보 보기", path: "/admin/employees", icon: "♙" },
        { title: "평가 승인 대기", value: pending.length, detail: "승인 요청 확인", path: "/admin/evaluations", icon: "◎" }
    ];
    const employeeName = id => data.employees.find(e => String(e.id) === String(id))?.name || "미배정";

    // 최근 공지사항: 고정 공지를 먼저, 남은 자리에 최신 공지를 채워 5개까지 보여줌
    const NOTICE_LIMIT = 5;
    const [notices, setNotices] = useState([]);
    const [noticeLoading, setNoticeLoading] = useState(true);
    const [noticeError, setNoticeError] = useState("");

    useEffect(() => {
        let alive = true;
        fetch(`${API_BASE}/api/notices`)
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(body.message || "공지사항을 불러오지 못했습니다.");
                return body;
            })
            .then((rows) => { if (alive) setNotices(Array.isArray(rows) ? rows : []); })
            .catch((err) => { if (alive) setNoticeError(err.message || "공지사항을 불러오지 못했습니다."); })
            .finally(() => { if (alive) setNoticeLoading(false); });
        return () => { alive = false; };
    }, []);

    const isPinned = (notice) => Number(notice.isPinned) === 1 || notice.isPinned === true;
    const pinnedNotices = notices.filter(isPinned).slice(0, NOTICE_LIMIT);
    const latestNotices = notices
        .filter((notice) => !isPinned(notice))
        .sort((a, b) => Number(b.id) - Number(a.id));
    const visibleNotices = [
        ...pinnedNotices,
        ...latestNotices.slice(0, NOTICE_LIMIT - pinnedNotices.length),
    ];


    // 재무관리 패널: 재직자 연봉 합계 (서버에서 합계만 받음)
    const [finance, setFinance] = useState(null);
    const [financeError, setFinanceError] = useState("");
    useEffect(() => {
        adminRequest("/finance/summary")
            .then(setFinance)
            .catch((err) => setFinanceError(err.message));
    }, []);

    // 프로젝트의 예상 계약 금액(budget) 기준 요약
    const budgetOf = (project) => Number(project.budget) || 0;
    const totalBudget = projects.reduce((sum, project) => sum + budgetOf(project), 0);
    const activeBudget = projects
        .filter((project) => [PROJECT_STATUS.IN_PROGRESS, "진행 중"].includes(project.status))
        .reduce((sum, project) => sum + budgetOf(project), 0);
    const topProjects = [...projects]
        .sort((a, b) => budgetOf(b) - budgetOf(a))
        .slice(0, 3);

    return (
        <div className="merge-dashboard">

            {/* ================================ */}
            {/* 1. 운영 대시보드 상단 제목 영역 */}
            {/* ================================ */}

            <div className="merge-title">
                <div>
                    <span>WORKSPACE / OVERVIEW</span>

                    <h1>운영 대시보드</h1>

                    <p>
                        프로젝트, 이슈, 인사 및 평가 현황을 한눈에 확인하세요.
                    </p>
                </div>

            </div>


            <div className="nexus-alerts">
                <div><strong>운영 알림 센터</strong><p>현재 데이터에서 확인된 관리 필요 항목</p></div>
                <button onClick={() => navigate('/admin/issues')}>기한 초과 이슈 <b>{overdue.length}건</b></button>
                <button onClick={() => navigate('/admin/members')}>미배정 프로젝트 <b>{unassigned.length}건</b></button>
                <button onClick={() => navigate('/admin/evaluations')}>평가 승인 요청 <b>{pending.length}건</b></button>
            </div>

            {/* ================================ */}
            {/* 2. 주요 현황 KPI 카드 영역 */}
            {/* ================================ */}

            <div className="merge-kpis">

                {/* cards 배열에 들어있는 데이터를 카드로 출력 */}
                {cards.map(card => (

                    <button
                        key={card.title}
                        className="card merge-kpi"

                        // 카드를 클릭하면 해당 관리 페이지로 이동
                        onClick={() => navigate(card.path)}
                    >
                        {/* 카드 아이콘 */}
                        <span className="merge-kpi-icon">
                            {card.icon}
                        </span>

                        {/* 카드 제목 */}
                        <span>
                            {card.title}
                        </span>

                        {/* 카드의 주요 수치 */}
                        <strong>
                            {card.value}
                        </strong>

                        {/* 카드의 추가 설명 */}
                        <small>
                            {card.detail} →
                        </small>
                    </button>

                ))}
            </div>


            {/* ================================ */}
            {/* 3. 프로젝트 및 관리자 확인 사항 */}
            {/* ================================ */}

            <div className="merge-columns">

                {/* 프로젝트 진행 현황 */}
                <DashboardPanel
                    title="프로젝트 진행 현황"
                    actionLabel="전체 보기 →"
                    onAction={() => navigate("/admin/projects")}
                >

                    {/* 프로젝트가 없는 경우 안내 문구 출력 */}
                    {projects.length === 0 ? (

                        <p>등록된 프로젝트가 없습니다.</p>

                    ) : (

                        // 프로젝트 배열에서 최대 6개까지만 출력
                        projects.slice(0, 6).map(project => (

                            <div
                                className="merge-project"
                                key={project.id}
                                onClick={() => navigate(`/admin/projects?project=${project.id}`)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* 프로젝트 이름, 상태, 담당자 */}
                                <div>
                                    <strong>
                                        {project.name}
                                    </strong>

                                    <span>
                                        {project.status} · {employeeName(project.managerId)}
                                    </span>
                                </div>

                                {/* 프로젝트 진행률 표시 막대 */}
                                <div className="merge-bar">

                                    <div
                                        style={{
                                            // 진행률을 0~100 사이로 제한
                                            // 숫자가 아니면 0으로 처리
                                            width: `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    Number(project.progress) || 0
                                                )
                                            )}%`
                                        }}
                                    />
                                </div>

                                {/* 프로젝트 진행률을 숫자로 표시 */}
                                <small>
                                    {Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            Number(project.progress) || 0
                                        )
                                    )}%
                                </small>

                            </div>

                        ))

                    )}

                </DashboardPanel>


                {/* 최근 공지사항 */}
                <DashboardPanel
                    title="공지사항"
                    actionLabel="공지사항 관리 →"
                    onAction={() => navigate("/admin/boards")}
                >

                    {noticeLoading && <p>공지사항을 불러오는 중입니다.</p>}

                    {!noticeLoading && noticeError && <p>{noticeError}</p>}

                    {!noticeLoading && !noticeError && visibleNotices.length === 0 && (
                        <p>등록된 공지사항이 없습니다.</p>
                    )}

                    {!noticeLoading && !noticeError && visibleNotices.map((notice) => (
                        <button
                            type="button"
                            className="merge-log merge-log-button"
                            key={notice.id}
                            onClick={() => navigate(`/admin/boards?notice=${notice.id}`)}
                        >
                            <strong>
                                {isPinned(notice) && (
                                    <span className="dash-pinned-badge">고정</span>
                                )}
                                {notice.title}
                            </strong>

                            <small>
                                {notice.author} · {notice.date} · 조회 {notice.views ?? 0}
                            </small>
                        </button>
                    ))}

                </DashboardPanel>

            </div>


            {/* ================================ */}
            {/* 4. 최근 이슈 및 공지사항 */}
            {/* ================================ */}

            <div className="merge-columns">

                {/* 최근 이슈 목록 */}
                <DashboardPanel
                    title="최근 이슈"
                    actionLabel="이슈 관리 →"
                    onAction={() => navigate("/admin/issues")}
                >

                    {/* 이슈 정보를 표 형태로 출력 */}
                    <div className="merge-table-wrap">

                        <table>
                            <thead>
                                <tr>
                                    <th>제목</th>
                                    <th>담당자</th>
                                    <th>상태</th>
                                    <th>우선순위</th>
                                </tr>
                            </thead>

                            <tbody>

                                {/* 최근 이슈를 최대 5개까지 출력 */}
                                {data.issues.slice(0, 5).map(issue => (

                                    <tr
                                        key={issue.id}
                                        onClick={() => navigate(`/admin/issues?issue=${issue.id}`)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>
                                            {issue.title}
                                        </td>

                                        <td>
                                            {employeeName(issue.assigneeId)}
                                        </td>

                                        <td>
                                            {issue.status}
                                        </td>

                                        <td>
                                            <span className="merge-erp-module">
                                                <span className={"pill issue-priority issue-priority-" + issue.priority}>
                                                    {issue.priority}
                                                </span>
                                            </span>
                                        </td>
                                    </tr>

                                ))}

                                {/* 등록된 이슈가 없을 때 표시 */}
                                {data.issues.length === 0 && (

                                    <tr>
                                        <td colSpan="4">
                                            등록된 이슈가 없습니다.
                                        </td>
                                    </tr>

                                )}

                            </tbody>
                        </table>

                    </div>

                </DashboardPanel>

                {/* 재무관리: 프로젝트 예상 계약 금액 요약 */}
                <DashboardPanel
                    title="재무관리"
                    actionLabel="프로젝트 관리 →"
                    onAction={() => navigate("/admin/projects")}
                >

                    <div className="merge-alert">
                        <b>총 급여 (재직자 연봉 합계)</b>
                        <strong>
                            {finance
                                ? `${finance.totalSalary.toLocaleString()}원`
                                : financeError
                                    ? "불러오기 실패"
                                    : "불러오는 중..."}
                        </strong>
                        {finance && <small> 재직 {finance.headcount}명</small>}
                    </div>

                    <div className="merge-alert">
                        <b>전체 예상 계약 금액</b>
                        <strong>{totalBudget.toLocaleString()}원</strong>
                    </div>

                    <div className="merge-alert">
                        <b>진행 중 프로젝트 금액</b>
                        <strong>{activeBudget.toLocaleString()}원</strong>
                    </div>

                    <p>금액이 큰 프로젝트</p>

                    {topProjects.map((project) => (
                        <button
                            type="button"
                            className="merge-log merge-log-button"
                            key={project.id}
                            onClick={() => navigate(`/admin/projects?project=${project.id}`)}
                        >
                            <strong>{project.name}</strong>

                            <small>
                                {project.customer || "-"} · {budgetOf(project).toLocaleString()}원
                            </small>
                        </button>
                    ))}

                    {topProjects.length === 0 && <p>등록된 프로젝트가 없습니다.</p>}

                </DashboardPanel>

            </div>


        </div>
    );

}
