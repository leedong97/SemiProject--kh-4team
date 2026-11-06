import React, { useEffect, useState } from "react";
import "./EmployeeEvaluation.css";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:3333") + "/api/evaluations";
const initialForm = { projectId: "", employeeId: "", period: "2026년 4분기", projectScore: 60, issueScore: 60, scheduleScore: 60, teamworkScore: 60, feedback: "" };

export default function EmployeeEvaluation() {
    const [context, setContext] = useState({ projects: [], members: [], employees: [], loginId: null, loginRole: "" });
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("전체");
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    // 선택한 프로젝트에 따라 참여 팀원과 평가 목록을 보여줍니다.
    const [viewProjectId, setViewProjectId] = useState("전체");

    // 모든 평가 데이터는 로그인 토큰을 이용해 MySQL에서 가져옵니다.
    async function request(path, options = {}) {
        const token = localStorage.getItem("nexus_auth_token");
        if (!token) throw new Error("로그인 후 다시 접속하세요.");
        const response = await fetch(API_BASE + path, {
            ...options,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...(options.headers || {}) }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "서버 요청에 실패했습니다.");
        return result;
    }
    async function loadData() {
        try {
            setLoading(true);
            const [nextContext, nextEvaluations] = await Promise.all([request("/context"), request("/")]);
            setContext(nextContext);
            setEvaluations(nextEvaluations);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    useEffect(function () { loadData(); }, []);

    const loginId = context.loginId;
    const isAdmin = context.loginRole === "관리자";
    const myProjects = context.projects.filter(function (project) { return Number(project.managerId) === Number(loginId); });
    const selectedProject = context.projects.find(function (project) { return String(project.id) === String(form.projectId); });
    const availableEmployees = context.employees.filter(function (employee) {
        return employee.status === "재직" && Number(employee.id) !== Number(loginId) && context.members.some(function (member) {
            return String(member.projectId) === String(form.projectId) && String(member.employeeId) === String(employee.id);
        });
    });
    const viewedProject = context.projects.find(function (project) {
        return String(project.id) === String(viewProjectId);
    });
    const viewedMembers = context.members.filter(function (member) {
        return String(member.projectId) === String(viewProjectId);
    });
    const canEvaluateProject = viewedProject && Number(viewedProject.managerId) === Number(loginId);
    function openNewForProject(projectId, employeeId = "") {
        setForm({ ...initialForm, projectId: String(projectId), employeeId: String(employeeId) });
        setEditingId(null);
        setShowForm(true);
    }
    const total = Number((Number(form.projectScore) * .35 + Number(form.issueScore) * .30 + Number(form.scheduleScore) * .15 + Number(form.teamworkScore) * .20).toFixed(1));
    const filtered = evaluations.filter(function (item) {
        const employee = context.employees.find(function (e) { return Number(e.id) === Number(item.employeeId); });
        const project = context.projects.find(function (p) { return Number(p.id) === Number(item.projectId); });
        return (viewProjectId === "전체" || String(item.projectId) === String(viewProjectId)) && (tab === "전체" || item.status === tab) && ((employee?.name || "") + (project?.name || "")).toLowerCase().includes(search.toLowerCase());
    });
    const selected = evaluations.find(function (item) { return item.id === selectedId; }) || filtered[0];
    function name(id) { return context.employees.find(function (e) { return Number(e.id) === Number(id); })?.name || "직원 #" + id; }
    function projectName(id) { return context.projects.find(function (p) { return Number(p.id) === Number(id); })?.name || "프로젝트 #" + id; }
    function dateTime(value) {
        if (!value) return "기록 없음";
        // MySQL DATETIME은 한국 시간으로 저장된 로컬 시간입니다.
        const text = String(value);
        const date = new Date(text);
        if (Number.isNaN(date.getTime())) return text;
        return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(date);
    }
    function openNew() {
        setForm({ ...initialForm, projectId: canEvaluateProject ? String(viewProjectId) : myProjects[0] ? String(myProjects[0].id) : "" });
        setEditingId(null);
        setShowForm(true);
    }
    function edit(item) {
        setForm({ projectId: String(item.projectId), employeeId: String(item.employeeId), period: item.period, projectScore: item.projectScore, issueScore: item.issueScore, scheduleScore: item.scheduleScore, teamworkScore: item.teamworkScore, feedback: item.feedback });
        setEditingId(item.id);
        setShowForm(true);
    }
    async function save(event) {
        event.preventDefault();
        if (!form.projectId || !form.employeeId || !form.feedback.trim() || !form.period.trim()) return alert("프로젝트, 직원, 기간, 의견을 입력하세요.");
        if ([form.projectScore, form.issueScore, form.scheduleScore, form.teamworkScore].some(s => !Number.isFinite(Number(s)) || Number(s) < 0 || Number(s) > 100)) return alert("점수는 0~100 사이로 입력하세요.");
        try {
            setBusy(true);
            await request(editingId ? "/" + editingId : "/", { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) });
            setShowForm(false);
            await loadData();
            alert(editingId ? "평가가 수정되었습니다." : "평가가 등록되었습니다.");
        } catch (err) { alert(err.message); } finally { setBusy(false); }
    }
    async function changeStatus(item, status) {
        let reason = "";
        if (status === "반려") { reason = window.prompt("반려 사유를 입력하세요.") || ""; if (!reason.trim()) return; }
        if (!window.confirm(status + " 처리하시겠습니까?")) return;
        try {
            setBusy(true);
            await request("/" + item.id + "/status", { method: "PATCH", body: JSON.stringify({ status, reason }) });
            await loadData();
        } catch (err) { alert(err.message); } finally { setBusy(false); }
    }
    async function appeal(item) {
        const reason = window.prompt("이의신청 사유를 입력하세요.");
        if (!reason || !reason.trim()) return;
        try {
            setBusy(true);
            await request("/" + item.id + "/appeal", { method: "POST", body: JSON.stringify({ reason }) });
            await loadData();
        } catch (err) { alert(err.message); } finally { setBusy(false); }
    }
    async function processAppeal(item, result) {
        if (!window.confirm("이의신청을 " + result + " 처리하시겠습니까?")) return;
        try {
            setBusy(true);
            await request("/" + item.id + "/appeal", { method: "PATCH", body: JSON.stringify({ result }) });
            await loadData();
        } catch (err) { alert(err.message); } finally { setBusy(false); }
    }
    const fields = [
        { key: "projectScore", title: "프로젝트 기여도", weight: "35%" },
        { key: "issueScore", title: "이슈 해결 품질", weight: "30%" },
        { key: "scheduleScore", title: "일정 준수", weight: "15%" },
        { key: "teamworkScore", title: "협업 및 소통", weight: "20%" }
    ];
    return <div className="employee-evaluation ev2026">
        <div className="ev2026-header">
            <div><span className="ev2026-eyebrow">WORKSPACE / PERFORMANCE</span><h2>직원 성과 평가</h2><p>프로젝트 담당자가 팀원의 업무 성과를 평가하고 관리합니다.</p></div>
            <div className="ev2026-top-actions"><span className="ev2026-role">{isAdmin ? "관리자" : myProjects.length ? "프로젝트 PM" : "직원"}</span><button type="button" className="secondary" onClick={loadData} disabled={loading}>새로고침</button>{myProjects.length > 0 && <button type="button" onClick={openNew}>+ 새 평가 등록</button>}</div>
        </div>
        {error && <p className="ev2026-error" role="alert">{error}</p>}
        {/* 모든 프로젝트를 조회하되, 평가 등록은 해당 프로젝트 PM에게만 허용합니다. */}
        <section className="ev2026-project-panel">
            <div className="ev2026-panel-head"><h3>프로젝트별 평가 권한</h3><span>전체 {context.projects.length}개 프로젝트</span></div>
            <div className="ev2026-project-picker">
                <label htmlFor="ev-project-select">프로젝트 선택</label>
                <select id="ev-project-select" value={viewProjectId} onChange={e => { setViewProjectId(e.target.value); setSelectedId(null); }}>
                    <option value="전체">전체 프로젝트 평가 보기</option>
                    {context.projects.map(project => <option key={project.id} value={project.id}>{project.name}{Number(project.managerId) === Number(loginId) ? " · 내 담당" : ""}</option>)}
                </select>
            </div>
            {viewProjectId === "전체" ? <p className="ev2026-project-help">프로젝트를 선택하면 참여 팀원과 평가 권한이 표시됩니다. 다른 프로젝트의 평가 내용은 권한에 따라 제한됩니다.</p> : <>
                <div className="ev2026-project-info">
                    <div><strong>{viewedProject?.name || "프로젝트 정보 없음"}</strong><small>프로젝트 #{viewProjectId} · 담당자 {name(viewedProject?.managerId)}</small></div>
                    <span className={canEvaluateProject ? "ev2026-permission allowed" : "ev2026-permission denied"}>{canEvaluateProject ? "평가 권한 있음" : "평가 권한 없음"}</span>
                </div>
                <div className="ev2026-team-head"><strong>프로젝트 참여 팀원</strong><span>{viewedMembers.length}명</span></div>
                {viewedMembers.length === 0 && <p className="ev2026-project-help">등록된 팀원이 없습니다. 프로젝트 팀원 배정부터 진행해 주세요.</p>}
                <div className="ev2026-team-list">
                    {viewedMembers.map(member => {
                        const employee = context.employees.find(e => Number(e.id) === Number(member.employeeId));
                        const isSelf = Number(member.employeeId) === Number(loginId);
                        const eligible = canEvaluateProject && !isSelf && employee?.status === "재직";
                        return <div className="ev2026-team-member" key={member.employeeId}>
                            <div><strong>{name(member.employeeId)}</strong><small>{employee?.department || "부서 정보 없음"} · 사번 {member.employeeId}{isSelf ? " · 본인" : ""}</small></div>
                            {eligible ? <button type="button" onClick={() => openNewForProject(viewProjectId, member.employeeId)}>평가 등록</button> : <span className="ev2026-team-disabled">{isSelf ? "본인 평가 불가" : !canEvaluateProject ? "PM 전용" : "평가 대상 제외"}</span>}
                        </div>;
                    })}
                </div>
            </>}
        </section>
        <div className="ev2026-stats">
            <div><span>조회 가능한 평가</span><strong>{evaluations.length}</strong><small>MySQL 저장 기준</small></div>
            <div><span>승인 완료</span><strong>{evaluations.filter(e => e.status === "승인").length}</strong><small>최종 확정</small></div>
            <div><span>승인 대기</span><strong>{evaluations.filter(e => e.status === "승인 요청").length}</strong><small>관리자 확인 필요</small></div>
            <div><span>이의신청 접수</span><strong>{evaluations.filter(e => e.appeal?.status === "접수").length}</strong><small>처리 대기</small></div>
        </div>
        <div className="ev2026-content">
            <section className="ev2026-panel">
                <div className="ev2026-panel-head"><h3>평가 목록</h3><span>{filtered.length}건</span></div>
                <input aria-label="직원 또는 프로젝트 검색" placeholder="직원명 또는 프로젝트 검색" value={search} onChange={e => setSearch(e.target.value)} />
                <div className="ev2026-tabs">{["전체", "초안", "승인 요청", "승인", "반려"].map(value => <button type="button" key={value} className={tab === value ? "active" : "secondary"} onClick={() => setTab(value)}>{value}</button>)}</div>
                {loading && <p className="ev2026-empty">불러오는 중입니다...</p>}
                {!loading && filtered.length === 0 && <p className="ev2026-empty">해당하는 평가가 없습니다. PM으로 배정된 프로젝트가 있는지 확인하세요.</p>}
                {filtered.map(item => <button type="button" key={item.id} className={"ev2026-person " + (selected?.id === item.id ? "chosen" : "")} onClick={() => setSelectedId(item.id)}>
                    <span><strong>{name(item.employeeId)}</strong><small>{projectName(item.projectId)} · {item.period}</small></span>
                    <span className="ev2026-person-right"><strong>{item.score}점</strong><em className={"ev2026-status status-" + item.status.replace(/ /g, "-")}>{item.status}</em></span>
                    <span className="ev2026-progress"><span style={{ width: item.score + "%" }} /></span>
                </button>)}
            </section>
            <section className="ev2026-panel ev2026-detail">
                {!selected ? <p className="ev2026-empty">평가를 선택하면 상세 내용이 표시됩니다.</p> : <>
                    <div className="ev2026-panel-head"><h3>{name(selected.employeeId)} 평가 상세</h3><em className={"ev2026-status status-" + selected.status.replace(/ /g, "-")}>{selected.status}</em></div>
                    <p className="ev2026-meta">{projectName(selected.projectId)} · {selected.period}</p>
                    <p className="ev2026-meta">평가자: {name(selected.evaluatorId)} · 수정: {dateTime(selected.updatedAt)}</p>
                    <div className="ev2026-score"><strong>{selected.score}</strong><span>/ 100점</span></div>
                    {fields.map(field => <div className="ev2026-score-row" key={field.key}><div><span>{field.title} <small>({field.weight})</small></span><strong>{selected[field.key]}점</strong></div><div className="ev2026-track"><span style={{ width: selected[field.key] + "%" }} /></div></div>)}
                    <div className="ev2026-feedback"><strong>평가 의견</strong><p>{selected.feedback}</p></div>
                    {selected.rejectReason && <p className="ev2026-error">반려 사유: {selected.rejectReason}</p>}
                    {selected.appeal && <div className="ev2026-feedback"><strong>이의신청 · {selected.appeal.status}</strong><p>{selected.appeal.reason}</p></div>}
                    <div className="ev2026-actions">
                        {Number(selected.evaluatorId) === Number(loginId) && ["초안", "반려"].includes(selected.status) && myProjects.some(p => Number(p.id) === Number(selected.projectId)) && <button type="button" className="secondary" disabled={busy} onClick={() => edit(selected)}>평가 수정</button>}
                        {Number(selected.evaluatorId) === Number(loginId) && ["초안", "반려"].includes(selected.status) && <button type="button" disabled={busy} onClick={() => changeStatus(selected, "승인 요청")}>승인 요청</button>}
                        {isAdmin && selected.status === "승인 요청" && Number(selected.evaluatorId) !== Number(loginId) && Number(selected.employeeId) !== Number(loginId) && <><button type="button" disabled={busy} onClick={() => changeStatus(selected, "승인")}>승인</button><button type="button" className="secondary" disabled={busy} onClick={() => changeStatus(selected, "반려")}>반려</button></>}
                        {selected.status === "승인" && Number(selected.employeeId) === Number(loginId) && !selected.appeal && <button type="button" disabled={busy} onClick={() => appeal(selected)}>이의신청</button>}
                        {isAdmin && selected.appeal?.status === "접수" && Number(selected.evaluatorId) !== Number(loginId) && Number(selected.employeeId) !== Number(loginId) && <><button type="button" disabled={busy} onClick={() => processAppeal(selected, "수용")}>이의신청 수용</button><button type="button" className="secondary" disabled={busy} onClick={() => processAppeal(selected, "기각")}>이의신청 기각</button></>}
                    </div>
                    <details className="ev2026-history"><summary>변경 이력 ({selected.history?.length || 0}건)</summary>{(selected.history || []).map((h, i) => <div key={i}><strong>{h.action}</strong> · {h.actorName || "담당자"}<small>{dateTime(h.at)}</small>{h.detail && <p>{h.detail}</p>}</div>)}</details>
                </>}
            </section>
        </div>
        {showForm && <div className="ev2026-modal-backdrop"><form className="ev2026-modal" onSubmit={save}>
            <div className="ev2026-panel-head"><h3>{editingId ? "평가 수정" : "새 평가 등록"}</h3><button type="button" className="secondary" onClick={() => setShowForm(false)}>닫기</button></div>
            <label>프로젝트<select required disabled={!!editingId} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, employeeId: "" })}><option value="">프로젝트 선택</option>{myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label>평가 대상 직원<select required disabled={!!editingId} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">팀원 선택</option>{availableEmployees.map(e => <option key={e.id} value={e.id}>{e.name} · {e.department}</option>)}{editingId && !availableEmployees.some(e => String(e.id) === String(form.employeeId)) && <option value={form.employeeId}>{name(form.employeeId)}</option>}</select></label>
            {selectedProject && <p className="ev2026-hint">선택한 프로젝트의 PM만 등록할 수 있습니다.</p>}
            <label>평가 기간<input required maxLength={40} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} /></label>
            {fields.map(field => <div className="ev2026-slider" key={field.key}><div><label>{field.title} ({field.weight})</label><strong>{form[field.key]}점</strong></div><input type="range" min="0" max="100" step="5" value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: Number(e.target.value) })} /></div>)}
            <div className="ev2026-total">가중 평균 <strong>{total} / 100점</strong></div>
            <label>평가 의견<textarea required rows="4" value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} placeholder="평가 근거와 개선점을 구체적으로 작성하세요." /></label>
            <div className="ev2026-actions"><button type="submit" disabled={busy}>{busy ? "저장 중..." : "MySQL에 저장"}</button></div>
        </form></div>}
    </div>;
}
