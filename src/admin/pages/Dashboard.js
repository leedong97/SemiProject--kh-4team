import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/MergedDashboard.css";

// 프로젝트 + 이슈 + 인사 + 평가를 하나의 화면에서 보여줍니다.
export default function Dashboard({ projects = [], data }) {
    const navigate = useNavigate();
    const today = new Date().toLocaleDateString("en-CA");
    const openIssues = data.issues.filter(issue => issue.status !== "완료");
    const overdue = openIssues.filter(issue => issue.due && issue.due < today);
    const pending = data.evaluations.filter(item => item.status === "승인 요청");
    const unassigned = projects.filter(project => project.managerId == null);
    const active = projects.filter(project => ["진행중", "진행 중"].includes(project.status));
    const cards = [
        { title: "전체 프로젝트", value: projects.length, detail: `진행 중 ${active.length}개`, path: "/admin/projects", icon: "▣" },
        { title: "미완료 이슈", value: openIssues.length, detail: `기한 초과 ${overdue.length}건`, path: "/admin/issues", icon: "◈" },
        { title: "재직 직원", value: data.employees.filter(e => e.status === "재직").length, detail: "인사 정보 보기", path: "/admin/employees", icon: "♙" },
        { title: "평가 승인 대기", value: pending.length, detail: "승인 요청 확인", path: "/admin/evaluations", icon: "◎" }
    ];
    const employeeName = id => data.employees.find(e => String(e.id) === String(id))?.name || "미배정";
    return <div className="merge-dashboard">
        <div className="merge-title"><div><span>WORKSPACE / OVERVIEW</span><h1>운영 대시보드</h1><p>프로젝트, 이슈, 인사 및 평가 현황을 한눈에 확인하세요.</p></div><button onClick={() => navigate("/admin/projects")}>+ 프로젝트 관리</button></div>
        <div className="merge-kpis">{cards.map(card => <button key={card.title} className="merge-kpi" onClick={() => navigate(card.path)}><span className="merge-kpi-icon">{card.icon}</span><span>{card.title}</span><strong>{card.value}</strong><small>{card.detail} →</small></button>)}</div>
        <div className="merge-columns">
            <section className="merge-panel"><div className="merge-panel-head"><h2>프로젝트 진행 현황</h2><button onClick={() => navigate("/admin/projects")}>전체 보기 →</button></div>
                {projects.length === 0 ? <p>등록된 프로젝트가 없습니다.</p> : projects.slice(0, 6).map(project => <div className="merge-project" key={project.id}><div><strong>{project.name}</strong><span>{project.status} · {employeeName(project.managerId)}</span></div><div className="merge-bar"><div style={{width: `${Math.max(0, Math.min(100, Number(project.progress) || 0))}%`}} /></div><small>{Math.max(0, Math.min(100, Number(project.progress) || 0))}%</small></div>)}
            </section>
            <section className="merge-panel"><div className="merge-panel-head"><h2>관리자 확인 사항</h2><span className="merge-count">{unassigned.length + overdue.length + pending.length}건</span></div>
                <button className="merge-alert" onClick={() => navigate("/admin/assignments")}><b>담당자 미배정 프로젝트</b><strong>{unassigned.length}건 →</strong></button>
                <button className="merge-alert" onClick={() => navigate("/admin/issues")}><b>기한 초과 이슈</b><strong>{overdue.length}건 →</strong></button>
                <button className="merge-alert" onClick={() => navigate("/admin/evaluations")}><b>평가 승인 요청</b><strong>{pending.length}건 →</strong></button>
            </section>
        </div>
        <div className="merge-columns">
            <section className="merge-panel"><div className="merge-panel-head"><h2>최근 이슈</h2><button onClick={() => navigate("/admin/issues")}>이슈 관리 →</button></div>
                <div className="merge-table-wrap"><table><thead><tr><th>제목</th><th>담당자</th><th>상태</th><th>우선순위</th></tr></thead><tbody>{data.issues.slice(0,5).map(issue => <tr key={issue.id}><td>{issue.title}</td><td>{employeeName(issue.assigneeId)}</td><td>{issue.status}</td><td>{issue.priority}</td></tr>)}{data.issues.length===0 && <tr><td colSpan="4">등록된 이슈가 없습니다.</td></tr>}</tbody></table></div>
            </section>
            <section className="merge-panel"><div className="merge-panel-head"><h2>최근 관리자 작업</h2><span>브라우저 데모 기록</span></div>
                {data.logs.length ? data.logs.slice(0,5).map(log => <div className="merge-log" key={log.id}><strong>{log.action}</strong><small>{log.at}</small></div>) : <p>아직 작업 기록이 없습니다.</p>}
            </section>
        </div>
        <p className="merge-demo-note">데모 데이터입니다. 로그인 및 작업 기록은 실제 보안 인증·감사 로그가 아닙니다.</p>
    </div>;
}
