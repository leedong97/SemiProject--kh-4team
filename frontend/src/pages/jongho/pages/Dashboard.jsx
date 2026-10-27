import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard({ projects = [], data }) {

    const navi = useNavigate()
    const today = new Date().toLocaleDateString("en-CA") //kr-KR
    const openIssues = data.issues.filter(issues => issues.status !== "완료")
    const overdue = openIssues.filter(issues => issues.due && issues.due < today)
    const pending = data.evaluations.filter(item => item.status === "승인 요청")
    const unassigned = projects.filter(project => project.managerId == null)
    const active = projects.filter(project => ["진행중", "진행 중"].includes(project.status))
    const cards = [
        { title: "전체 프로젝트", value: projects.length, detail: `진행 중 ${active.length}개`, path: "/admin/projects", icon: "▣" },
        { title: "미완료 이슈", value: openIssues.length, detail: `기한 초과 ${overdue.length}건`, path: "/admin/issues", icon: "◈" },
        { title: "재직 직원", value: data.employees.filter(e => e.status === "재직").length, detail: "인사 정보 보기", path: "/admin/employees", icon: "♙" },
        { title: "평가 승인 대기", value: pending.length, detail: "승인 요청 확인", path: "/admin/evaluations", icon: "◎" }
    ]
    const employeeName = id => data.employees.find(e => String(e.id) === String(id))?.name || "미배정"

    return (
        <div className="merge -dashboard">

            <div className="merge-title">
                <span>WORKSPACE / OVERVIEW</span>

                <h1>운영 대시보드</h1>

                <p>
                    프로젝트,이슈,인사 및 평가현황을 한눈에 확인하세요.
                </p>
            </div>
            <div>
                <button className="btn btn-primary" onClick={() => navi("/admin/projects")}> + 프로젝트 관리 </button>
            </div>

            <div className="merge-kpis">
                {cards.map(card => (
                    // 카드를 클릭하면 해당 페이지로 이동
                    <button key={card.title} className="card merge-kpi" onClick={() => navi(card.path)}>

                        {/* 카드 아이콘 */}
                        <span className="merge-kpi-icon">{card.icon}</span>

                        {/* 카드 제목 */}
                        <span>{card.title}</span>

                        {/* 카드의 주요 수치 */}
                        <span>{card.value}</span>

                        {/* 카드의 추가 설명 */}
                        <span>{card.detail}</span>

                    </button>
                ))}
            </div>

            {/*프로젝트 및 관리자 확인 사항  */}
            <div className="merge-columns">

                {/* 프로젝트 진행 현황 */}
                <section className="card merge-panel">

                    <div className="merge-panel-head">
                        <h2>프로젝트 진행 현황</h2>

                        <button className="btn btn-ghost"
                            onClick={() => navi("/admin/projects")}>
                            전체 보기 →
                        </button>
                    </div>

                    {/* 프로젝트가 없는 경우 안내 문구 출력 */}
                    {projects.length === 0 ? (
                        <p>등록된 프로젝트가 없습니다</p>
                    ) : (
                        // 프로젝트 배열에서 최대 6개 까지만 출력
                        projects.slice(0, 6).map(project => (

                            <div className="merge-project" key={project.id}>

                                {/* 프로젝트 이름,상태,담당자 */}
                                <div>
                                    <strong>{project.name}</strong>

                                    <span>{project.status} · {employeeName(project.managerId)}</span>
                                </div>

                                {/* 프로젝트 진행률 표시 막대  */}
                                <div className="merge-bar">
                                    <div style={{
                                        // 진행률을 0~100로 제한, 숫자가 아니면 0으로 처리
                                        width: `${Math.max(0, Math.min(100, Number(project.progress) || 0))}%`
                                    }}>

                                    </div>
                                </div>

                                <small>
                                    {Math.max(0, Math.min(100, Number(project.progress) || 0))}%
                                </small>
                            </div>
                        ))
                    )}

                </section>

                {/* 관리자 확인 사항 */}
                <section className="card merge-panel">

                    <div className=" merge-panel-head">
                        <h2>관리자 확인 사항</h2>

                        {/* 세가지 확인 사항의 전체 개수 */}
                        <span className="merge-count">
                            {unassigned.length + overdue.length + pending.length}건
                        </span>
                    </div>

                    {/* 담당자가 배정되지 않은 프로젝트 */}
                    <button className="merge-alert"
                        onClick={() => navi("/admin/assignments")}>
                        <b>담당자 미배정 프로젝트</b>

                        <strong>
                            {unassigned.length}건 →
                        </strong>
                    </button>

                    {/* 처리 기한이 지난 이슈 */}
                    <button className="merge-alert"
                        onClick={() => navi("/admin/issues")}>
                        <b>기한 초과 이슈</b>

                        <strong>
                            {overdue.length}건 →
                        </strong>
                    </button>

                    {/* 관리자 승인이 필요한 평가 */}
                    <button className="merge-alert"
                        onClick={() => navi("/admin/evaluations")}>
                        <b>평가 승인 요청</b>

                        <strong>
                            {pending.length}건 →
                        </strong>
                    </button>
                </section>
            </div>

            {/* 최근 이슈 및 관리자 작업기록 */}

            <div className="merge-columns">

                {/* 최근 이슈 목록 */}
                <section className="card merge-panel">

                    <div className="merge-panel-head">
                        <h2>최근 이슈</h2>

                        <button className="btn btn-ghost"
                            onClick={() => navi("/admin/issues")}>
                            이슈 관리  →
                        </button>
                    </div>

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
                                    <tr key={issue.id}>
                                        <td>{issue.title}</td>
                                        <td>{employeeName(issue.assigneeId)}</td>
                                        <td>{issue.status}</td>
                                        <td>
                                            <span className="merge-erp-module">
                                                <span className={"pill issue-priority issue-priority-" + issue.priority}>
                                                    {issue.priority}
                                                </span>
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {/* 등록된 이슈가 없을 떄 표시 */}
                                {data.issues.length === 0 && (
                                    <tr>
                                        <td colSpan="4">
                                            등록된 이슈가 없습니다
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 최근 관리자 작업기록 */}
                <section className="card merge-panel">

                    <div className="merge-panel-head">
                        <h2>최근 관리자 작업</h2>

                        <span>브라우저 데모 기록</span>
                    </div>

                    {/* 작업 기록이 있으면 최근 5개 출력 */}
                    {data.logs.length ? (
                        data.logs.slice(0, 5).map(log => (
                            <div className="merge-log" key={log.id}>

                                {/* 관리자가 실행할 작업 */}
                                <strong>
                                    {log.action}
                                </strong>

                                {/* 작업이 실행된 시간 */}
                                <small>
                                    {log.at}
                                </small>
                            </div>
                        ))
                    ) : (
                        // 작업기록이 없는 경우
                        <p>아직 작업기록이 없습니다</p>
                    )}
                </section>

                {/* 데모 데이터 안내 문구 */}
                <p className="merge-demo-note">
                    데모 데이터 입니다.로그인 및 작업기록은 실제 보안 인증·감사 로그가 아닙니다
                </p>
            </div>
        </div>
    )
}

export default Dashboard