import { API_BASE as SERVER_BASE } from "../../../shared/config";
import SearchInput from "../../../shared/SearchInput";
import React, { useEffect, useState } from "react";
import "./EmployeeEvaluation.css";
const API_BASE = SERVER_BASE + "/api/evaluations";
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
    const [selectedId, setSelectedId] = useState(null);
    const [busy, setBusy] = useState(false);
    // 선택한 프로젝트에 따라 참여 팀원과 평가 목록을 보여줍니다.
    const [viewProjectId, setViewProjectId] = useState("전체");
    // 모든 평가 데이터는 로그인 토큰을 이용해 MySQL에서 가져옵니다.
    async function request(path, options = {}) {
        const token = localStorage.getItem("nexus_auth_token");
        if (!token)
            throw new Error("로그인 후 다시 접속하세요.");
        const response = await fetch(API_BASE + path, {
            ...options,
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...(options.headers || {}) }
        });
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.message || "서버 요청에 실패했습니다.");
        return result;
    }
    async function loadData() {
        try {
            setLoading(true);
            const [nextContext, nextEvaluations] = await Promise.all([request("/context"), request("/")]);
            setContext(nextContext);
            setEvaluations(nextEvaluations);
            setError("");
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(function () { loadData(); }, []);
    const loginId = context.loginId;
    const isAdmin = context.loginRole === "관리자";
    const myProjects = context.projects.filter(function (project) { return loginId != null && Number(project.managerId) === Number(loginId); });
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
        return myProjects.some(p => String(p.id) === String(item.projectId)) && (viewProjectId === "전체" || String(item.projectId) === String(viewProjectId)) && ((employee?.name || "") + (project?.name || "")).toLowerCase().includes(search.toLowerCase());
    });
    // 최신 등록/수정 평가가 먼저 보이도록 정렬합니다. 확정 평가도 목록에서 유지합니다.
    filtered.sort(function (a, b) {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
        if (aTime !== bTime) return bTime - aTime;
        return Number(b.id) - Number(a.id);
    });
    const selected = filtered.find(function (item) { return item.id === selectedId; }) || filtered[0];
    function name(id) { return context.employees.find(function (e) { return Number(e.id) === Number(id); })?.name || "직원 #" + id; }
    function projectName(id) { return context.projects.find(function (p) { return Number(p.id) === Number(id); })?.name || "프로젝트 #" + id; }
    function dateTime(value) {
        if (!value)
            return "기록 없음";
        // MySQL DATETIME은 한국 시간으로 저장된 로컬 시간입니다.
        const text = String(value);
        const date = new Date(text);
        if (Number.isNaN(date.getTime()))
            return text;
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
        if (!form.projectId || !form.employeeId || !form.feedback.trim() || !form.period.trim())
            return alert("프로젝트, 직원, 기간, 의견을 입력하세요.");
        if ([form.projectScore, form.issueScore, form.scheduleScore, form.teamworkScore].some(s => !Number.isFinite(Number(s)) || Number(s) < 0 || Number(s) > 100))
            return alert("점수는 0~100 사이로 입력하세요.");
        try {
            setBusy(true);
            await request(editingId ? "/" + editingId : "/", { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) });
            setShowForm(false);
            await loadData();
            alert(editingId ? "평가가 수정되었습니다." : "평가가 등록되었습니다.");
        }
        catch (err) {
            alert(err.message);
        }
        finally {
            setBusy(false);
        }
    }
    // 작성한 PM이 직접 최종 확정합니다. 확정 후에는 수정할 수 없습니다.
    async function confirmEvaluation(item) {
        if (!window.confirm("평가를 확정하시겠습니까? 확정 후에는 수정할 수 없습니다.")) return;
        try {
            setBusy(true);
            await request("/" + item.id + "/status", {
                method: "PATCH",
                body: JSON.stringify({ status: "승인" })
            });
            await loadData();
            alert("평가가 확정되어 직원 평가 이력에 반영되었습니다.");
        } catch (err) {
            alert(err.message);
        } finally {
            setBusy(false);
        }
    }
    const fields = [
        { key: "projectScore", title: "프로젝트 기여도", weight: "35%" },
        { key: "issueScore", title: "이슈 해결 품질", weight: "30%" },
        { key: "scheduleScore", title: "일정 준수", weight: "15%" },
        { key: "teamworkScore", title: "협업 및 소통", weight: "20%" }
    ];
    return <div className="employee-evaluation ev2026">
        <div className="ev2026-header">


            <div className="ev2026-top-actions">
                <span className="ev2026-role">
                    {isAdmin ? "관리자" : myProjects.length ? "프로젝트 PM" : "직원"}
                </span>
                <button type="button" className="secondary" onClick={loadData} disabled={loading}>새로고침</button>

            </div>
        </div>
        {error && <p className="ev2026-error" role="alert">
            {error}
        </p>}
        {/* 본인이 담당하는 프로젝트만 보여줍니다. */}
        <section className="ev2026-project-panel">
            <div className="ev2026-panel-head">
                <h3>프로젝트별 평가 권한</h3>
                <span>전체 {myProjects.length}개 프로젝트</span>
            </div>
            <div className="ev2026-project-picker">
                <label htmlFor="ev-project-select">프로젝트 선택</label>
                <select id="ev-project-select" value={viewProjectId} onChange={e => { setViewProjectId(e.target.value); setSelectedId(null); }}>
                    <option value="전체">내 프로젝트 전체 보기</option>
                    {myProjects.map(project => <option key={project.id} value={project.id}>
                        {project.name}{Number(project.managerId) === Number(loginId) ? " · 내 담당" : ""}
                    </option>)}
                </select>
            </div>
            {viewProjectId === "전체" ? <p className="ev2026-project-help">프로젝트를 선택하면 참여 팀원과 평가 권한이 표시됩니다. 본인이 담당하는 프로젝트의 평가만 표시됩니다.</p> : <>
                <div className="ev2026-project-info">
                    <div>
                        <strong>
                            {viewedProject?.name || "프로젝트 정보 없음"}
                        </strong>
                        <small>프로젝트 #{viewProjectId} · 담당자 {name(viewedProject?.managerId)}
                        </small>
                    </div>
                    <span className={canEvaluateProject ? "ev2026-permission allowed" : "ev2026-permission denied"}>
                        {canEvaluateProject ? "평가 권한 있음" : "평가 권한 없음"}
                    </span>
                </div>
                <div className="ev2026-team-head">
                    <strong>프로젝트 참여 팀원</strong>
                    <span>
                        {viewedMembers.length}명</span>
                </div>
                {viewedMembers.length === 0 && <p className="ev2026-project-help">등록된 팀원이 없습니다. 프로젝트 팀원 배정부터 진행해 주세요.</p>}
                <div className="ev2026-team-list">
                    {viewedMembers.map(member => {
                        const employee = context.employees.find(e => Number(e.id) === Number(member.employeeId));
                        const isSelf = Number(member.employeeId) === Number(loginId);
                        const eligible = canEvaluateProject && !isSelf && employee?.status === "재직";
                        return <div className="ev2026-team-member" key={member.employeeId}>
                            <div>
                                <strong>
                                    {name(member.employeeId)}
                                </strong>
                                <small>
                                    {employee?.department || "부서 정보 없음"} · 사번 {member.employeeId}{isSelf ? " · 본인" : ""}
                                </small>
                            </div>
                            {eligible ? <button type="button" onClick={() => openNewForProject(viewProjectId, member.employeeId)}>평가 등록</button> : <span className="ev2026-team-disabled">
                                {isSelf ? "본인 평가 불가" : !canEvaluateProject ? "PM 전용" : "평가 대상 제외"}
                            </span>}
                        </div>;
                    })}
                </div>
            </>}
        </section>
        <div className="ev2026-stats">
            <div>
                <span>조회 가능한 평가</span>
                <strong>
                    {evaluations.length}
                </strong>
                <small>MySQL 저장 기준</small>
            </div>
            <div>
                <span>평가 확정</span>
                <strong>
                    {evaluations.filter(e => e.status === "승인").length}
                </strong>
                <small>최종 확정</small>
            </div>
            <div>
                <span>미확정 평가</span>
                <strong>
                    {evaluations.filter(e => ["초안", "반려", "승인 요청"].includes(e.status)).length}
                </strong>
                <small>PM 확정 필요</small>
            </div>

        </div>
        <div className="ev2026-content">
            <section className="ev2026-panel">
                <div className="ev2026-panel-head">
                    <h3>평가 목록</h3>
                    <span>
                        {filtered.length}건</span>
                </div>
                <SearchInput aria-label="직원 또는 프로젝트 검색" placeholder="직원명 또는 프로젝트 검색" value={search} onChange={e => setSearch(e.target.value)} />
                {loading && <p className="ev2026-empty">불러오는 중입니다...</p>}
                {!loading && filtered.length === 0 && <p className="ev2026-empty">해당하는 평가가 없습니다. PM으로 배정된 프로젝트가 있는지 확인하세요.</p>}
                {filtered.map(item => <button type="button" key={item.id} className={"ev2026-person " + (selected?.id === item.id ? "chosen" : "")} onClick={() => setSelectedId(item.id)}>
                    <span>
                        <strong>
                            {name(item.employeeId)}
                        </strong>
                        <small>
                            {projectName(item.projectId)} · {item.period}
                        </small>
                    </span>
                    <span className="ev2026-person-right">
                        <strong>
                            {item.score}점</strong>
                        <em className={"ev2026-status status-" + item.status.replace(/ /g, "-")}>
                            {item.status}
                        </em>
                    </span>
                    <span className="ev2026-progress">
                        <span style={{ width: item.score + "%" }} />
                    </span>
                </button>)}
            </section>
            <section className="ev2026-panel ev2026-detail">
                {!selected ? <p className="ev2026-empty">평가를 선택하면 상세 내용이 표시됩니다.</p> : <>
                    <div className="ev2026-panel-head">
                        <h3>
                            {name(selected.employeeId)} 평가 상세</h3>
                        <em className={"ev2026-status status-" + selected.status.replace(/ /g, "-")}>
                            {selected.status === "승인" ? "평가 확정" : selected.status}
                        </em>
                    </div>
                    <p className="ev2026-meta">
                        {projectName(selected.projectId)} · {selected.period}
                    </p>
                    <p className="ev2026-meta">평가자: {name(selected.evaluatorId)} · 수정: {dateTime(selected.updatedAt)}
                    </p>
                    <div className="ev2026-score">
                        <strong>
                            {selected.score}
                        </strong>
                        <span>/ 100점</span>
                    </div>
                    {fields.map(field => <div className="ev2026-score-row" key={field.key}>
                        <div>
                            <span>
                                {field.title} <small>({field.weight})</small>
                            </span>
                            <strong>
                                {selected[field.key]}점</strong>
                        </div>
                        <div className="ev2026-track">
                            <span style={{ width: selected[field.key] + "%" }} />
                        </div>
                    </div>)}
                    <div className="ev2026-feedback">
                        <strong>평가 의견</strong>
                        <p>
                            {selected.feedback}
                        </p>
                    </div>
                    {selected.rejectReason && <p className="ev2026-error">반려 사유: {selected.rejectReason}
                    </p>}
                    <div className="ev2026-actions">
                        {Number(selected.evaluatorId) === Number(loginId) && ["초안", "반려"].includes(selected.status) && myProjects.some(p => Number(p.id) === Number(selected.projectId)) && <button type="button" className="secondary" disabled={busy} onClick={() => edit(selected)}>평가 수정</button>}
                        {Number(selected.evaluatorId) === Number(loginId) && ["초안", "반려", "승인 요청"].includes(selected.status) && myProjects.some(p => Number(p.id) === Number(selected.projectId)) && <button type="button" disabled={busy} onClick={() => confirmEvaluation(selected)}>평가 확정</button>}
                        {selected.status === "승인" && <span>평가 확정 완료</span>}
                    </div>
                    <details className="ev2026-history">
                        <summary>변경 이력 ({selected.history?.length || 0}건)</summary>
                        {(selected.history || []).map((h, i) => <div key={i}>
                            <strong>
                                {h.action}
                            </strong> · {h.actorName || "담당자"}
                            <small>
                                {dateTime(h.at)}
                            </small>
                            {h.detail && <p>
                                {h.detail}
                            </p>}
                        </div>)}
                    </details>
                </>}
            </section>
        </div>
        {showForm && <div className="ev2026-modal-backdrop">
            <form className="ev2026-modal" onSubmit={save}>
                <div className="ev2026-panel-head">
                    <h3>
                        {editingId ? "평가 수정" : "새 평가 등록"}
                    </h3>
                    <button type="button" className="secondary" onClick={() => setShowForm(false)}>닫기</button>
                </div>
                <label>프로젝트<select required disabled={!!editingId} value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value, employeeId: "" })}>
                    <option value="">프로젝트 선택</option>
                    {myProjects.map(p => <option key={p.id} value={p.id}>
                        {p.name}
                    </option>)}
                </select>
                </label>
                <label>평가 대상 직원<select required disabled={!!editingId} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                    <option value="">팀원 선택</option>
                    {availableEmployees.map(e => <option key={e.id} value={e.id}>
                        {e.name} · {e.department}
                    </option>)}{editingId && !availableEmployees.some(e => String(e.id) === String(form.employeeId)) && <option value={form.employeeId}>
                        {name(form.employeeId)}
                    </option>}
                </select>
                </label>
                {selectedProject && <p className="ev2026-hint">선택한 프로젝트의 PM만 등록할 수 있습니다.</p>}
                <label>평가 기간<input required maxLength={40} value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} />
                </label>
                {fields.map(field => <div className="ev2026-slider" key={field.key}>
                    <div>
                        <label>
                            {field.title} ({field.weight})</label>
                        <strong>
                            {form[field.key]}점</strong>
                    </div>
                    <input type="range" min="0" max="100" step="5" value={form[field.key]} onChange={e => setForm({ ...form, [field.key]: Number(e.target.value) })} />
                </div>)}
                <div className="ev2026-total">가중 평균 <strong>
                    {total} / 100점</strong>
                </div>
                <label>평가 의견<textarea required rows="4" value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} placeholder="평가 근거와 개선점을 구체적으로 작성하세요." />
                </label>
                <div className="ev2026-actions">
                    <button type="submit" disabled={busy}>
                        {busy ? "저장 중..." : "저장"}
                    </button>
                </div>
            </form>
        </div>}
    </div>;
}
