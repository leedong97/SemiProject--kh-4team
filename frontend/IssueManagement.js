import React, { useState, useEffect } from "react";
import "./IssueManagement.css";
import { erpRequest } from "../erpApi";
import { API_BASE } from "../../../shared/config";
export default function IssueManagement({
    data,
    currentUser
}) {
    // 검색어와 요청사항 입력
    const [search, setSearch] = useState("");
    const [comments, setComments] = useState({});

    // 2. 화면 표시 상태
    const [expandedIssueId, setExpandedIssueId] = useState(null);
    const [dbRequests, setDbRequests] = useState({});
    useEffect(function () {
        if (!expandedIssueId) return;
        erpRequest('/issues/' + expandedIssueId + '/requests').then(function (result) {
            setDbRequests(function (old) {
                return { ...old, [expandedIssueId]: result.requests || [] };
            });
        }).catch(function (error) {
            console.warn('요청사항 조회 실패:', error.message);
        });
    }, [expandedIssueId]);

    // 3. 검색 필터
    const [statusFilter, setStatusFilter] = useState("전체");
    const [priorityFilter, setPriorityFilter] = useState("전체");
    const [assigneeFilter, setAssigneeFilter] = useState("전체");
    const [projectFilter, setProjectFilter] = useState("전체");

    // 4. 페이지네이션
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 5. 작업 시간 및 검증 입력
    const [verificationComments, setVerificationComments] = useState({});

    // 6. 부모 컴포넌트에서 받은 데이터
    // DB 조회가 성공하면 DB 목록만 표시합니다. 실패 시에는 오류를 보여줍니다.
    const [dbIssues, setDbIssues] = useState([]);
    const [issuesLoading, setIssuesLoading] = useState(true);
    const [issuesError, setIssuesError] = useState("");
    const issues = dbIssues;
    const employees = data?.employees || [];
    const projects = data?.projects || [];
    // DB 프로젝트 목록과 이슈별 프로젝트/고객사 정보를 조회합니다.
    const [dbProjects, setDbProjects] = useState([]);


    // 이슈 목록은 DB가 유일한 기준입니다. 저장 후에도 다시 조회합니다.
    async function loadIssues() {
        try {
            const rows = await erpRequest('/issues');
            if (!Array.isArray(rows)) throw new Error('이슈 API 응답이 배열이 아닙니다.');
            setDbIssues(rows.map(function (item) {
                return {
                    ...item,
                    id: Number(item.id),
                    number: Number(item.id),
                    projectId: item.projectId == null ? null : Number(item.projectId),
                    assigneeId: item.assigneeId == null ? null : Number(item.assigneeId),
                    due: item.due || '',
                    comments: [], history: [], workLogs: []
                };
            }));
            setIssuesError('');
        } catch (error) {
            setIssuesError(error.message);
        } finally {
            setIssuesLoading(false);
        }
    }

    useEffect(function () {
        loadIssues();
        erpRequest('/projects').then(function (rows) {
            setDbProjects(Array.isArray(rows) ? rows : []);
        }).catch(function (error) {
            setIssuesError('프로젝트 목록 조회 실패: ' + error.message);
        });
    }, []);

    function getProjectInfo(issue) {
        const savedIssue = issue;
        const id = savedIssue.projectId || issue.projectId || issue.project_id;
        const project = dbProjects.find(function (p) {
            return String(p.project_id) === String(id);
        }) || projects.find(function (p) {
            return String(p.id ?? p.project_id) === String(id);
        });
        return {
            name: savedIssue.projectName || project?.project_title || project?.title || '프로젝트 미지정',
            customer: savedIssue.customerName || project?.customer_name || project?.customerName || '고객사 미지정',
            endDate: savedIssue.projectEndDate || project?.end_date || '미지정'
        };
    }
    // 휴지통에 있는 이슈는 일반 화면에서 제외한다.
    const activeIssues = issues.filter(issue => !issue.deletedAt);
    const deletedIssues = issues.filter(issue => Boolean(issue.deletedAt));

    // 8. 오늘 날짜 구하기

    function getToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // 9. 직원 이름 조회

    function employeeName(id) {
        if (id == null || id === "") return "미지정";
        const employee = employees.find(e => String(e.id ?? e.employee_id) === String(id));
        const assignedIssue = issues.find(issue => String(issue.assigneeId) === String(id) && issue.assigneeName);
        return employee?.name || employee?.employee_name || assignedIssue?.assigneeName || "직원 #" + id;
    }

    // 10. 프로젝트 이름 조회

    function projectName(id) {
        const project = (dbProjects.length ? dbProjects : projects).find(p => String(p.id ?? p.project_id) === String(id));
        return project?.title || project?.name || project?.project_title || "프로젝트 미지정";
    }

    // 12. 이슈 수정 및 변경 이력 기록

    async function updateIssue(id, patch, description) {
        // 실제 issues 테이블에 존재하는 필드만 수정 요청합니다.
        const dbPatch = {};
        ['title', 'description', 'priority', 'status', 'assigneeId', 'due', 'projectId'].forEach(function (key) {
            if (patch[key] !== undefined) dbPatch[key] = patch[key];
        });
        if (Object.keys(dbPatch).length === 0) {
            window.alert('이 변경사항은 DB 저장 기능이 아직 연결되지 않았습니다.');
            return;
        }
        try {
            await erpRequest('/issues/' + id, 'PATCH', dbPatch);
            await loadIssues();
        } catch (error) {
            window.alert('이슈 DB 수정 실패: ' + error.message);
        }
    }

    // 13. 담당자 변경

    function changeAssignee(issue, newId) {
        const nextId = Number(newId) || null;
        if (issue.assigneeId === nextId) {
            return;
        }
        updateIssue(issue.id, {
            assigneeId: nextId
        }, `${issue.title}: 담당자 ` + `${employeeName(issue.assigneeId)} → ` + `${employeeName(nextId)}`);
    }

    // 14. 요청사항 댓글 등록

    async function addComment(issue) {
        const message = (comments[issue.id] || "").trim();
        if (!message) {
            return;
        }
        try {
            await erpRequest('/issues/' + issue.id + '/requests', 'POST', { content: message });
            const result = await erpRequest('/issues/' + issue.id + '/requests');
            setDbRequests(old => ({ ...old, [issue.id]: result.requests || [] }));
            setComments(old => ({ ...old, [issue.id]: '' }));
            window.alert('요청사항이 등록되고 메인 알림에 전달되었습니다.');
        } catch (error) {
            window.alert('요청사항 등록 실패: ' + error.message);
        }
    }

    // 15. 이슈 상태 변경

    function changeStatus(issue, newStatus) {
        if (issue.status === newStatus) {
            return;
        }
        if (newStatus === "완료") {
            alert("검증 완료 버튼을 이용하세요.");
            return;
        }
        if (newStatus === "재오픈") {
            alert("재오픈 버튼을 이용하세요.");
            return;
        }
        if (issue.status === "완료") {
            alert("완료된 이슈는 먼저 재오픈하세요.");
            return;
        }
        updateIssue(issue.id, {
            status: newStatus
        }, `${issue.title}: 상태 ${issue.status} → ${newStatus}`);
    }

    // 16. 검증 완료

    function verifyIssue(issue) {
        if (issue.status !== "검토 중") {
            alert("검토 중인 이슈만 검증할 수 있습니다.");
            return;
        }
        const comment = (verificationComments[issue.id] || "").trim();
        updateIssue(issue.id, {
            status: "완료",
            resolvedAt: new Date().toLocaleString("ko-KR")
        }, `${issue.title}: 검증 완료` + (comment ? " - " + comment : ""));
        setVerificationComments(old => ({
            ...old,
            [issue.id]: ""
        }));
    }

    // 17. 완료된 이슈 재오픈

    function reopenIssue(issue) {
        if (issue.status !== "완료") {
            alert("완료된 이슈만 재오픈할 수 있습니다.");
            return;
        }
        updateIssue(issue.id, {
            status: "재오픈",
            resolvedAt: null
        }, `${issue.title}: 이슈 재오픈`);
    }

    // 18. 다음 작업 단계로 이동

    function nextStatus(issue) {
        if (issue.status === "접수" || issue.status === "재오픈") {
            changeStatus(issue, "진행 중");
            return;
        }
        if (issue.status === "진행 중") {
            changeStatus(issue, "검토 중");
            return;
        }
        if (issue.status === "검토 중") {
            verifyIssue(issue);
            return;
        }
        if (issue.status === "완료") {
            reopenIssue(issue);
        }
    }

    // 19. 다음 작업 버튼 이름

    function nextStatusLabel(status) {
        if (status === "접수" || status === "재오픈") {
            return "진행 시작";
        }
        if (status === "진행 중") {
            return "검토 요청";
        }
        if (status === "검토 중") {
            return "검증 완료";
        }
        if (status === "완료") {
            return "재오픈";
        }
        return "상태 변경";
    }

    // 20. 이슈 상태별 CSS 클래스
    //
    // getStatusClass 오류 해결 부분
    // 반드시 return 위에 선언해야 함

    function getStatusClass(status) {
        if (status === "접수") {
            return "issue-status-received";
        }
        if (status === "진행 중") {
            return "issue-status-progress";
        }
        if (status === "검토 중") {
            return "issue-status-review";
        }
        if (status === "완료") {
            return "issue-status-complete";
        }
        if (status === "재오픈") {
            return "issue-status-reopen";
        }
        return "";
    }

    // 23. 삭제 대신 휴지통으로 이동한다.
    async function deleteIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 임시 저장으로 이동하시겠습니까?`)) return;
        try {
            await erpRequest('/issues/' + issue.id + '/draft', 'PATCH', { draft: true });
            await loadIssues();
            setExpandedIssueId(null);
        } catch (error) {
            window.alert('임시 저장 실패: ' + error.message);
        }
    }

    async function restoreIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 복구하시겠습니까?`)) return;
        try {
            await erpRequest('/issues/' + issue.id + '/draft', 'PATCH', { draft: false });
            await loadIssues();
        } catch (error) {
            window.alert('복구 실패: ' + error.message);
        }
    }

    // 24. 이슈 통계: 임시 저장을 제외한 DB 이슈를 공통 기준으로 사용합니다.
    const todayKey = getToday();
    const threeDaysDate = new Date(todayKey + "T12:00:00");
    threeDaysDate.setDate(threeDaysDate.getDate() + 3);
    const threeDaysKey = [
        threeDaysDate.getFullYear(),
        String(threeDaysDate.getMonth() + 1).padStart(2, "0"),
        String(threeDaysDate.getDate()).padStart(2, "0")
    ].join("-");

    const unfinishedIssues = activeIssues.filter(issue => issue.status !== "완료");
    const totalIssues = activeIssues.length;
    const completedIssues = activeIssues.filter(issue => issue.status === "완료").length;
    const ongoingIssues = activeIssues.filter(issue => issue.status === "진행 중").length;
    const completionRate = totalIssues === 0 ? 0 : Math.round(completedIssues / totalIssues * 100);

    // 긴급: 우선순위 '긴급'이면서 미완료 (마감일과는 별개의 기준)
    const urgentIssueList = unfinishedIssues.filter(issue => issue.priority === "긴급");
    const urgentIssues = urgentIssueList.length;

    // 기한 초과: 오늘보다 이전 마감일 / 마감 임박: 오늘부터 3일 후까지
    const overdueIssueList = unfinishedIssues.filter(issue => issue.due && issue.due < todayKey);
    const overdueIssues = overdueIssueList.length;
    const upcomingIssues = unfinishedIssues.filter(issue =>
        issue.due && issue.due >= todayKey && issue.due <= threeDaysKey
    );

    // 상태별, 중요도별 분석 (동일한 activeIssues 사용)
    const statusNames = ["접수", "진행 중", "검토 중", "완료", "재오픈"];
    const priorityNames = ["낮음", "보통", "높음", "긴급"];
    const statusStats = statusNames.map(name => ({
        name,
        count: activeIssues.filter(issue => issue.status === name).length
    }));
    const priorityStats = priorityNames.map(name => ({
        name,
        count: activeIssues.filter(issue => issue.priority === name).length
    }));

    // 담당자별 업무량: 프로젝트 참여 명단이 아니라 실제 배정된 미완료 이슈 기준
    const workloadMap = {};
    unfinishedIssues.forEach(function (issue) {
        if (issue.assigneeId == null) return;
        const id = String(issue.assigneeId);
        if (!workloadMap[id]) {
            workloadMap[id] = {
                id: issue.assigneeId,
                name: issue.assigneeName || employeeName(issue.assigneeId),
                projectIds: [],
                count: 0,
                ongoing: 0,
                urgent: 0,
                overdue: 0
            };
        }
        const item = workloadMap[id];
        item.count += 1;
        if (issue.status === "진행 중") item.ongoing += 1;
        if (issue.priority === "긴급") item.urgent += 1;
        if (issue.due && issue.due < todayKey) item.overdue += 1;
        if (issue.projectId != null && !item.projectIds.includes(issue.projectId)) {
            item.projectIds.push(issue.projectId);
        }
    });
    const employeeWorkload = Object.values(workloadMap).map(item => ({
        ...item,
        projectCount: item.projectIds.length
    })).sort((a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name), "ko"));
    const unassignedCount = unfinishedIssues.filter(issue => issue.assigneeId == null).length;
    const maxWorkload = Math.max(1, ...employeeWorkload.map(item => item.count));

    // 25. 검색 및 필터

    const filtered = activeIssues.filter(issue => {
        const matchSearch = (issue.title || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "전체" || issue.status === statusFilter;
        const matchPriority = priorityFilter === "전체" || issue.priority === priorityFilter;
        const matchAssignee = assigneeFilter === "전체" || (assigneeFilter === "미지정" ? issue.assigneeId == null : String(issue.assigneeId) === assigneeFilter);
        const matchProject = projectFilter === "전체" || (projectFilter === "미지정" ? issue.projectId == null : String(issue.projectId) === projectFilter);
        return matchSearch && matchStatus && matchPriority && matchAssignee && matchProject;
    });

    // 26. 페이지네이션

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedIssues = filtered.slice(startIndex, startIndex + itemsPerPage);

    // 27. 화면 출력

    return <section className="issue-Management">
        {/* 페이지 제목 */}
        <div className="section-head">
            <h2>이슈 관리</h2>
            <p>프로젝트별 이슈 현황 및 작업 관리</p>
        </div>
        <div className="issue-stats">
            <div className="panel issue-stat-card">
                <span>전체 이슈</span>
                <h3>{totalIssues}</h3>
            </div>
            <div className="panel issue-stat-card">
                <span>진행 중</span>
                <h3>{ongoingIssues}</h3>
            </div>
            <div className="panel issue-stat-card">
                <span>긴급 이슈</span>
                <h3>{urgentIssues}</h3>
            </div>
            <div className="panel issue-stat-card">
                <span>기한 초과</span>
                <h3>{overdueIssues}</h3>
            </div>
        </div>
        {/* 통계 분석: 동일한 DB 이슈 목록에서 계산한 수치 */}
        <details className="panel issue-analysis-panel issue-optional-section">
            <summary>통계 분석 · 완료율 {completionRate}% (펼쳐서 확인)</summary>
            <div className="issue-analysis-body" style={{ padding: "16px 0" }}>
                <p>전체 {totalIssues}건 · 완료 {completedIssues}건 · 미완료 {unfinishedIssues.length}건 · 임시 저장 {deletedIssues.length}건(집계 제외)</p>
                <p>긴급 {urgentIssues}건 · 마감 임박 {upcomingIssues.length}건 · 기한 초과 {overdueIssues}건</p>
                <h4>상태별 이슈</h4>
                {statusStats.map(item => (
                    <div key={item.name} className="issue-analysis-row" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <span style={{ width: 80 }}>{item.name}</span>
                        <div style={{ flex: 1, height: 10, background: "#e9edf5", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ width: (totalIssues ? item.count / totalIssues * 100 : 0) + "%", height: "100%", background: "#4d7ef2" }} />
                        </div>
                        <strong>{item.count}건</strong>
                    </div>
                ))}
                <h4>중요도별 이슈</h4>
                {priorityStats.map(item => (
                    <div key={item.name} className="issue-analysis-row" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                        <span style={{ width: 80 }}>{item.name}</span>
                        <div style={{ flex: 1, height: 10, background: "#e9edf5", borderRadius: 6, overflow: "hidden" }}>
                            <div style={{ width: (totalIssues ? item.count / totalIssues * 100 : 0) + "%", height: "100%", background: "#4d7ef2" }} />
                        </div>
                        <strong>{item.count}건</strong>
                    </div>
                ))}
                <p className="issue-meta">완료율 = 완료 / 전체 × 100. 상태별·중요도별 통계는 임시 저장을 제외한 전체 이슈를 기준으로 합니다.</p>
            </div>
        </details>
        {/* 담당자별 업무량: 필요한 경우에만 열어 보는 간단한 목록 */}
        <details className="issue-workload-panel panel issue-optional-section">
            <summary>
                <span className="issue-workload-title">담당자별 업무량</span>
                <span className="issue-workload-hint">실제 배정된 미완료 이슈 기준 · 클릭하여 필터</span>
            </summary>
            <div className="issue-workload-body">
                {employeeWorkload.length === 0 ? <p className="issue-workload-empty">"담당자가 배정된 미완료 이슈가 없습니다."</p> : <div className="issue-workload-list">
                    {employeeWorkload.map(function (item) {
                        const selected = assigneeFilter === String(item.id);
                        return <button type="button" key={item.id} className={selected ? "issue-workload-row active" : "issue-workload-row"} aria-pressed={selected} onClick={function () {
                            setAssigneeFilter(String(item.id));
                            setCurrentPage(1);
                        }}>
                            <span className="issue-workload-person"><span className="issue-workload-name">{item.name}</span><span className="issue-workload-projects">관련 프로젝트 {item.projectCount}개</span></span>
                            <span className="issue-workload-meter">
                                <span style={{
                                    width: item.count / maxWorkload * 100 + "%"
                                }} />
                            </span>
                            <strong className="issue-workload-count">{item.count}건</strong>
                            <span className="issue-workload-flags">
                                {item.ongoing > 0 && <span className="issue-workload-progress">진행 중 {item.ongoing}</span>}
                                {item.urgent > 0 && <span className="issue-workload-urgent">긴급 {item.urgent}</span>}
                                {item.overdue > 0 && <span className="issue-workload-overdue">지연 {item.overdue}</span>}
                            </span>
                        </button>;
                    })}
                </div>}
                <div className="issue-workload-footer">
                    <span>미완료 이슈 건수(난이도 미반영) · 미배정 {unassignedCount}건</span>
                    <button type="button" onClick={function () {
                        setAssigneeFilter("전체");
                        setCurrentPage(1);
                    }}>
                        필터 초기화
                    </button>
                </div>
            </div>
        </details>
        {/* 관리자 우선 확인: 긴급 이슈와 마감 임박 이슈 */}
        <details className="issue-alert-wrapper issue-optional-section">
            <summary>긴급 · 마감 임박 이슈 <span>펼쳐서 확인</span></summary>
            <div className="issue-alert-grid">
                <div className="issue-alert-panel">
                    <h3>긴급 이슈</h3>
                    <p>우선순위 긴급 · 미완료 {urgentIssueList.length}건</p>
                    {urgentIssueList.length === 0 && <p>긴급 이슈가 없습니다.</p>}
                    {urgentIssueList.slice(0, 5).map(issue => <div className="issue-alert-item" key={issue.id}>
                        <button type="button" className="issue-alert-link" onClick={() => {
                            setSearch(issue.title);
                            setStatusFilter("전체");
                            setPriorityFilter("전체");
                            setAssigneeFilter("전체");
                            setProjectFilter("전체");
                            setCurrentPage(1);
                            setExpandedIssueId(issue.id);
                        }}>
                            {issue.title}
                        </button>
                        <span>{issue.assigneeName || employeeName(issue.assigneeId)}</span>
                    </div>)}
                </div>
                <div className="issue-alert-panel">
                    <h3>마감 임박</h3>
                    <p>오늘 포함 3일 후까지 · 미완료 {upcomingIssues.length}건 (기한 초과 제외)</p>
                    {upcomingIssues.length === 0 && <p>마감 임박 이슈가 없습니다.</p>}
                    {upcomingIssues.slice(0, 5).map(issue => <div className="issue-alert-item" key={issue.id}>
                        <button type="button" className="issue-alert-link" onClick={() => {
                            setSearch(issue.title);
                            setStatusFilter("전체");
                            setPriorityFilter("전체");
                            setAssigneeFilter("전체");
                            setProjectFilter("전체");
                            setCurrentPage(1);
                            setExpandedIssueId(issue.id);
                        }}>
                            {issue.title}
                        </button>
                        <span>{issue.due}</span>
                    </div>)}
                </div>
            </div>
        </details>

        <div className="issue-toolbar">
            <input className="search" placeholder="이슈 제목 검색" value={search} onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
            }} />
        </div>
        <div className="issue-tabs">
            {["전체", "접수", "진행 중", "검토 중", "완료", "재오픈"].map(status => <button type="button" key={status} className={statusFilter === status ? "active" : "secondary"} onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
            }}>
                {status}
            </button>)}
        </div>
        <div className="panel issue-filter-panel">
            <div className="form-row">
                <select value={projectFilter} onChange={e => {
                    setProjectFilter(e.target.value);
                    setCurrentPage(1);
                }}>
                    <option value="전체">전체 프로젝트</option>
                    <option value="미지정">프로젝트 미지정</option>
                    {(dbProjects.length ? dbProjects : projects).map(project => <option key={project.project_id || project.id} value={project.project_id || project.id}>
                        {project.title || project.name || project.project_title}
                    </option>)}
                </select>
                <select value={priorityFilter} onChange={e => {
                    setPriorityFilter(e.target.value);
                    setCurrentPage(1);
                }}>
                    <option value="전체">전체 중요도</option>
                    <option>낮음</option>
                    <option>보통</option>
                    <option>높음</option>
                    <option>긴급</option>
                </select>
                <select value={assigneeFilter} onChange={e => {
                    setAssigneeFilter(e.target.value);
                    setCurrentPage(1);
                }}>
                    <option value="전체">전체 담당자</option>
                    <option value="미지정">담당자 미지정</option>
                    {employees.map(employee => <option key={employee.id || employee.employee_id} value={employee.id || employee.employee_id}>
                        {employee.name || employee.employee_name}
                    </option>)}
                </select>
            </div>
            <p>검색 결과: {filtered.length}개</p>
        </div>
        {issuesLoading && <div className="panel"><p>DB에서 이슈를 불러오는 중입니다.</p></div>}
        {issuesError && <div className="panel"><p className="error">DB 연결 오류: {issuesError}</p><button type="button" onClick={loadIssues}>다시 조회</button></div>}
        {!issuesLoading && !issuesError && paginatedIssues.length === 0 && <div className="panel">
            <p>표시할 이슈가 없습니다.</p>
        </div>}
        {!issuesError && paginatedIssues.map(issue => {
            const isExpanded = expandedIssueId === issue.id;
            const issueComments = dbRequests[issue.id] || [];
            const issueHistory = issue.history || [];
            return <article className="panel issue-list-item" key={issue.id}>
                <div className={"issue-list-header issue-border-" + issue.priority} onClick={() => setExpandedIssueId(isExpanded ? null : issue.id)}>
                    <div className="issue-list-title">
                        {/* 이슈 번호 및 제목 */}
                        <h3>
                            {isExpanded ? "▼" : "▶"}
                            {" "}
                            #{issue.number || issue.id}
                            {" · "}
                            {issue.title}
                        </h3>
                        {/* 상태와 중요도 색상 표시 */}
                        <div className="issue-badge-row">
                            <span className={"issue-status-badge " + getStatusClass(issue.status)}>
                                {issue.status}
                            </span>
                            <span className={"pill issue-priority issue-priority-" + issue.priority}>
                                {issue.priority}
                            </span>
                            {/* 기한 초과 표시 */}
                            {issue.due && issue.status !== "완료" && issue.due < getToday() && <span className="issue-overdue-badge">
                                ⚠ 기한 초과
                            </span>}
                        </div>
                        {/* 프로젝트 정보만 카드형으로 변경하고 나머지 이슈 UI는 유지합니다. */}
                        <div className="issue-project-info">
                            <div><span>프로젝트명</span><strong>{getProjectInfo(issue).name}</strong></div>
                            <div><span>고객사</span><strong>{getProjectInfo(issue).customer}</strong></div>
                            <div><span>프로젝트 마감일</span><strong>{getProjectInfo(issue).endDate}</strong></div>
                            <div><span>담당자</span><strong>{(issue.assigneeName || employeeName(issue.assigneeId))}</strong></div>
                        </div>
                    </div>
                </div>
                {isExpanded && <div className="issue-expanded-content">
                    {/* 상세 설명 */}
                    <div className="issue-detail">
                        <h4>이슈 상세정보</h4>
                        <p>
                            <strong>프로젝트: </strong>
                            {projectName(issue.projectId)}
                        </p>
                        <p>
                            <strong>등록일: </strong>
                            {issue.createdAt || "미기록"}
                        </p>
                        <p>
                            <strong>상세 설명: </strong>
                            {issue.description || "등록된 설명 없음"}
                        </p>
                        <p>
                            <strong>재현 방법: </strong>
                            {issue.reproduction || "등록된 내용 없음"}
                        </p>
                    </div>
                    {/* 담당자 및 마감일 수정 */}
                    <div className="form-row">
                        <label>
                            담당자
                            <select value={issue.assigneeId || ""} onChange={e => changeAssignee(issue, e.target.value)}>
                                <option value="">미지정</option>
                                {employees.map(employee => <option key={employee.id || employee.employee_id} value={employee.id || employee.employee_id}>
                                    {employee.name || employee.employee_name}
                                </option>)}
                            </select>
                        </label>
                        <label>
                            마감일
                            <input type="date" value={issue.due || ""} onChange={e => updateIssue(issue.id, {
                                due: e.target.value
                            }, `${issue.title}: 마감일 변경`)} />
                        </label>
                    </div>
                    {/* 마감일 초과 경고 */}
                    {issue.due && issue.status !== "완료" && issue.due < getToday() && <p className="error">
                        마감일이 지났습니다.
                    </p>}
                    <div className="issue-status-section">
                        <h4>이슈 처리</h4>
                        <p>
                            현재 상태:{" "}
                            <strong>{issue.status}</strong>
                        </p>
                        {issue.status === "검토 중" && <input placeholder="검증 결과 또는 확인 내용" value={verificationComments[issue.id] || ""} onChange={e => setVerificationComments(old => ({
                            ...old,
                            [issue.id]: e.target.value
                        }))} />}
                        <button type="button" onClick={() => nextStatus(issue)}>
                            {nextStatusLabel(issue.status)}
                        </button>
                        {issue.resolvedAt && <p className="issue-meta">
                            완료일: {issue.resolvedAt}
                        </p>}
                    </div>
                    <div className="issue-comment-section">
                        <h4>요청사항 코멘트</h4>
                        <div className="form-row">
                            <input placeholder="요청사항 코멘트 작성" value={comments[issue.id] || ""} onChange={e => setComments(old => ({
                                ...old,
                                [issue.id]: e.target.value
                            }))} />
                            <button type="button" className="secondary" onClick={() => addComment(issue)}>
                                요청사항 등록
                            </button>
                        </div>
                        {/* 등록된 댓글 */}
                        {issueComments.map((comment, index) => <p key={comment.id || index} className="history">
                            {typeof comment === "string" ? comment : `${comment.createdAt} · ${comment.author}: ${comment.content}`}
                        </p>)}
                    </div>
                    <details>
                        <summary>
                            변경 이력 {issueHistory.length}개
                        </summary>
                        {issueHistory.map((history, index) => <p key={index} className="history">
                            {history.at}
                            {" · "}
                            {history.userName || "작성자 미기록"}
                            {" — "}
                            {history.text}
                        </p>)}
                    </details>
                    {/* 이슈 삭제 */}
                    <div className="issue-delete-area">
                        <button type="button" className="secondary" onClick={() => deleteIssue(issue)}>
                            임시 저장으로 이동
                        </button>
                    </div>
                </div>}
            </article>;
        })}
        <div className="issue-pagination">
            <button type="button" className="secondary" disabled={safeCurrentPage === 1} onClick={() => {
                setCurrentPage(safeCurrentPage - 1);
                setExpandedIssueId(null);
            }}>
                이전
            </button>
            <span>
                {safeCurrentPage} / {totalPages}
            </span>
            <button type="button" className="secondary" disabled={safeCurrentPage === totalPages} onClick={() => {
                setCurrentPage(safeCurrentPage + 1);
                setExpandedIssueId(null);
            }}>
                다음
            </button>
        </div>
        {/* 휴지통: 삭제한 이슈를 복구할 수 있다. */}
        <details className="issue-trash">
            <summary>임시 저장 ({deletedIssues.length}건)</summary>
            {deletedIssues.length === 0 && <p>이슈가 없습니다.</p>}
            {deletedIssues.map(issue => <div className="issue-trash-item" key={issue.id}>
                <div>
                    <strong>{issue.title}</strong>
                    <p>이동자: {issue.deletedBy || "미기록"}</p>
                    <p>이동 시각: {issue.deletedAt || "미기록"}</p>
                </div>
                <button type="button" onClick={() => restoreIssue(issue)}>
                    복구
                </button>
            </div>)}
        </details>
    </section>;
}
