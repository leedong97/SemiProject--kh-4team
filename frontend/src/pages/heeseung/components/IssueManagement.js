import React, { useState } from "react";
import "./IssueManagement.css";

export default function IssueManagement({ data, changeData, currentUser }) {

    // 부모 컴포넌트에서 로그인 사용자 정보를 전달한다.
    // 로그인 연동 전에는 임시 사용자로 표시한다.
    const loginUser = currentUser || {
        id: null,
        name: "임시 사용자"
    };
    const loginUserName = loginUser.name || loginUser.employee_name || "임시 사용자";

    // 실제 급여 정보가 아닌 예시 시간당 인건비
    const hourlyCost = 20000;


    // 1. 이슈 등록 입력값
    const [title, setTitle] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [due, setDue] = useState("");
    const [priority, setPriority] = useState("보통");
    const [search, setSearch] = useState("");
    const [comments, setComments] = useState({});
    const [projectId, setProjectId] = useState("");
    const [description, setDescription] = useState("");
    const [reproduction, setReproduction] = useState("");

    // 2. 화면 표시 상태
    const [showRegister, setShowRegister] = useState(false);
    const [expandedIssueId, setExpandedIssueId] = useState(null);

    // 3. 검색 필터
    const [statusFilter, setStatusFilter] = useState("전체");
    const [priorityFilter, setPriorityFilter] = useState("전체");
    const [assigneeFilter, setAssigneeFilter] = useState("전체");
    const [projectFilter, setProjectFilter] = useState("전체");

    // 4. 페이지네이션
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // 5. 작업 시간 및 검증 입력
    const [workDescriptions, setWorkDescriptions] = useState({});
    const [workMinutes, setWorkMinutes] = useState({});
    const [verificationComments, setVerificationComments] = useState({});

    // 6. 부모 컴포넌트에서 받은 데이터
    const issues = data?.issues || [];
    const employees = data?.employees || [];
    const projects = data?.projects || [];

    // 휴지통에 있는 이슈는 일반 화면에서 제외한다.
    const activeIssues = issues.filter(issue => !issue.deletedAt);
    const deletedIssues = issues.filter(issue => Boolean(issue.deletedAt));

    // 7. 고유 ID 생성

    function createId() {
        // 브라우저에서 고유 ID 생성 기능을 지원하면 사용한다.
        if (typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        // 지원하지 않는 브라우저에서는 시간과 난수를 조합한다.
        return Date.now().toString() + "-" +
            Math.random().toString(36).slice(2);
    }

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
        const employee = employees.find(
            e => String(e.id) === String(id)
        );
        return employee?.name ||
            employee?.employee_name ||
            "미지정";
    }

    // 10. 프로젝트 이름 조회

    function projectName(id) {
        const project = projects.find(
            p => String(p.id) === String(id)
        );
        return project?.title ||
            project?.name ||
            project?.project_title ||
            "프로젝트 미지정";
    }

    // 11. 새로운 이슈 등록

    function addIssue(event) {
        event.preventDefault();
        if (!title.trim()) {
            alert("이슈 제목을 입력하세요.");
            return;
        }
        // 기존 이슈를 하나씩 확인하여 다음 번호를 구한다.
        let maxNumber = 0;

        for (let i = 0; i < issues.length; i++) {
            let issueNumber = Number(issues[i].number);

            // 예전 데이터에 번호가 없으면 숫자 ID를 확인한다.
            if (!issueNumber) {
                const oldId = Number(issues[i].id);

                if (oldId < 100000) {
                    issueNumber = oldId;
                }
            }

            if (issueNumber > maxNumber) {
                maxNumber = issueNumber;
            }
        }

        const nextNumber = maxNumber + 1;

        const issue = {
            id: createId(),
            number: nextNumber,
            title: title.trim(),
            assigneeId: Number(assigneeId) || null,
            due,
            priority,
            status: "접수",
            projectId: Number(projectId) || null,
            description: description.trim(),
            reproduction: reproduction.trim(),
            comments: [],
            history: [],
            workLogs: [],
            createdAt: new Date().toLocaleString("ko-KR"),
            resolvedAt: null,
            deletedAt: null,
            deletedBy: null,
            deletedById: null
        };
        // 부모 컴포넌트의 데이터 변경 함수 호출
        changeData(
            "이슈 등록: " + issue.title,
            old => ({
                ...old,
                issues: [
                    issue,
                    ...(old.issues || [])
                ]
            })
        );
        // 등록 후 입력창 초기화
        setTitle("");
        setAssigneeId("");
        setDue("");
        setPriority("보통");
        setProjectId("");
        setDescription("");
        setReproduction("");
        setShowRegister(false);
        setCurrentPage(1);
        setExpandedIssueId(issue.id);
        setSearch("");
        setStatusFilter("전체");
        setPriorityFilter("전체");
        setAssigneeFilter("전체");
        setProjectFilter("전체");
    }

    // 12. 이슈 수정 및 변경 이력 기록

    function updateIssue(id, patch, description) {
        changeData(
            description,
            old => ({
                ...old,
                issues: (old.issues || []).map(issue => {
                    if (issue.id !== id) {
                        return issue;
                    }
                    const history = [
                        ...(issue.history || []),
                        {
                            id: createId(),
                            at: new Date().toLocaleString("ko-KR"),
                            text: description,
                            userId: loginUser.id,
                            userName: loginUserName
                        }
                    ];
                    return {
                        ...issue,
                        ...patch,
                        history
                    };
                })
            })
        );
    }

    // 13. 담당자 변경

    function changeAssignee(issue, newId) {
        const nextId = Number(newId) || null;
        if (issue.assigneeId === nextId) {
            return;
        }
        updateIssue(
            issue.id,
            {
                assigneeId: nextId
            },
            `${issue.title}: 담당자 ` +
            `${employeeName(issue.assigneeId)} → ` +
            `${employeeName(nextId)}`
        );
    }

    // 14. 요청사항 댓글 등록

    function addComment(issue) {
        const message = (comments[issue.id] || "").trim();
        if (!message) {
            return;
        }
        const comment = {
            id: createId(),
            content: message,
            author: loginUserName,
            authorId: loginUser.id,
            createdAt: new Date().toLocaleString("ko-KR")
        };
        updateIssue(
            issue.id,
            {
                comments: [
                    ...(issue.comments || []),
                    comment
                ]
            },
            `${issue.title}: 요청사항 등록`
        );
        setComments(old => ({
            ...old,
            [issue.id]: ""
        }));
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
        updateIssue(
            issue.id,
            {
                status: newStatus
            },
            `${issue.title}: 상태 ${issue.status} → ${newStatus}`
        );
    }

    // 16. 검증 완료

    function verifyIssue(issue) {
        if (issue.status !== "검토 중") {
            alert("검토 중인 이슈만 검증할 수 있습니다.");
            return;
        }
        const comment = (
            verificationComments[issue.id] || ""
        ).trim();
        updateIssue(
            issue.id,
            {
                status: "완료",
                resolvedAt: new Date().toLocaleString("ko-KR")
            },
            `${issue.title}: 검증 완료` +
            (comment ? " - " + comment : "")
        );
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
        updateIssue(
            issue.id,
            {
                status: "재오픈",
                resolvedAt: null
            },
            `${issue.title}: 이슈 재오픈`
        );
    }

    // 18. 다음 작업 단계로 이동

    function nextStatus(issue) {
        if (
            issue.status === "접수" ||
            issue.status === "재오픈"
        ) {
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

    // 21. 작업 시간 등록

    function addWorkLog(issue) {
        const workDescription = (
            workDescriptions[issue.id] || ""
        ).trim();
        const minutes = Number(workMinutes[issue.id]);
        if (!workDescription) {
            alert("작업 내용을 입력하세요.");
            return;
        }
        if (!Number.isInteger(minutes) || minutes <= 0) {
            alert("작업 시간을 1분 이상의 정수로 입력하세요.");
            return;
        }
        const workLog = {
            id: createId(),
            description: workDescription,
            minutes,
            employeeName: loginUserName,
            employeeId: loginUser.id,
            createdAt: new Date().toLocaleString("ko-KR")
        };
        updateIssue(
            issue.id,
            {
                workLogs: [
                    ...(issue.workLogs || []),
                    workLog
                ]
            },
            `${issue.title}: 작업 시간 ${minutes}분 등록`
        );
        setWorkDescriptions(old => ({
            ...old,
            [issue.id]: ""
        }));
        setWorkMinutes(old => ({
            ...old,
            [issue.id]: ""
        }));
    }

    // 22. 작업 시간 빠른 선택

    function selectWorkMinutes(issueId, minutes) {
        setWorkMinutes(old => ({
            ...old,
            [issueId]: String(minutes)
        }));
    }

    // 23. 삭제 대신 휴지통으로 이동한다.
    function deleteIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 임시 저장으로 이동하시겠습니까?`)) {
            return;
        }
        updateIssue(
            issue.id,
            {
                deletedAt: new Date().toISOString(),
                deletedBy: loginUserName,
                deletedById: loginUser.id
            },
            `${issue.title}: 임시저장 이동`
        );
        setExpandedIssueId(null);
    }

    // 휴지통에서 복구한다. 기존 이력과 작업 기록은 유지된다.
    function restoreIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 복구하시겠습니까?`)) {
            return;
        }
        updateIssue(
            issue.id,
            {
                deletedAt: null,
                deletedBy: null,
                deletedById: null
            },
            `${issue.title}: 임시저장 복구`
        );
    }

    // 24. 이슈 요약 카드 계산

    const totalIssues = activeIssues.length;

    const ongoingIssues = activeIssues.filter(
        issue => issue.status === "진행 중"
    ).length;

    const urgentIssues = activeIssues.filter(
        issue =>
            issue.priority === "긴급" &&
            issue.status !== "완료"
    ).length;

    const overdueIssues = activeIssues.filter(
        issue =>
            issue.due &&
            issue.status !== "완료" &&
            issue.due < getToday()
    ).length;

    // 관리자가 우선 확인할 긴급 이슈
    const urgentIssueList = activeIssues.filter(issue =>
        issue.priority === "긴급" && issue.status !== "완료"
    );

    // 마감일이 오늘부터 3일 이내인 이슈
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(todayDate);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const upcomingIssues = activeIssues.filter(issue => {
        if (!issue.due || issue.status === "완료") {
            return false;
        }
        const dueDate = new Date(issue.due + "T00:00:00");
        return dueDate >= todayDate && dueDate <= threeDaysLater;
    });

    // 담당자별 미완료 이슈 개수 (건수이며 실제 업무 난이도는 반영하지 않음)
    const employeeWorkload = employees.map(employee => ({
        id: employee.id,
        name: employee.name || employee.employee_name || "이름 없음",
        count: activeIssues.filter(issue =>
            String(issue.assigneeId) === String(employee.id) &&
            issue.status !== "완료"
        ).length
    }));

    // 25. 검색 및 필터

    const filtered = activeIssues.filter(issue => {
        const matchSearch = (issue.title || "")
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchStatus =
            statusFilter === "전체" ||
            issue.status === statusFilter;
        const matchPriority =
            priorityFilter === "전체" ||
            issue.priority === priorityFilter;
        const matchAssignee =
            assigneeFilter === "전체" ||
            (
                assigneeFilter === "미지정"
                    ? issue.assigneeId == null
                    : String(issue.assigneeId) === assigneeFilter
            );
        const matchProject =
            projectFilter === "전체" ||
            (
                projectFilter === "미지정"
                    ? issue.projectId == null
                    : String(issue.projectId) === projectFilter
            );
        return (
            matchSearch &&
            matchStatus &&
            matchPriority &&
            matchAssignee &&
            matchProject
        );
    });

    // 26. 페이지네이션

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    const safeCurrentPage = Math.min(
        currentPage,
        totalPages
    );

    const startIndex = (
        safeCurrentPage - 1
    ) * itemsPerPage;

    const paginatedIssues = filtered.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    // 27. 화면 출력

    return (
        <section className="issue-Management">
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
            {/* 관리자 우선 확인: 긴급 이슈와 마감 임박 이슈 */}
            <div className="issue-alert-grid">
                <div className="issue-alert-panel">
                    <h3>긴급 이슈</h3>
                    <p>우선 처리할 이슈 {urgentIssueList.length}건</p>
                    {urgentIssueList.length === 0 && <p>긴급 이슈가 없습니다.</p>}
                    {urgentIssueList.slice(0, 5).map(issue => (
                        <div className="issue-alert-item" key={issue.id}>
                            <button
                                type="button"
                                className="issue-alert-link"
                                onClick={() => {
                                    setSearch(issue.title);
                                    setStatusFilter("전체");
                                    setPriorityFilter("전체");
                                    setAssigneeFilter("전체");
                                    setProjectFilter("전체");
                                    setCurrentPage(1);
                                    setExpandedIssueId(issue.id);
                                }}
                            >
                                {issue.title}
                            </button>
                            <span>{employeeName(issue.assigneeId)}</span>
                        </div>
                    ))}
                </div>
                <div className="issue-alert-panel">
                    <h3>마감 임박</h3>
                    <p>오늘부터 3일 이내 {upcomingIssues.length}건</p>
                    {upcomingIssues.length === 0 && <p>마감 임박 이슈가 없습니다.</p>}
                    {upcomingIssues.slice(0, 5).map(issue => (
                        <div className="issue-alert-item" key={issue.id}>
                            <button
                                type="button"
                                className="issue-alert-link"
                                onClick={() => {
                                    setSearch(issue.title);
                                    setStatusFilter("전체");
                                    setPriorityFilter("전체");
                                    setAssigneeFilter("전체");
                                    setProjectFilter("전체");
                                    setCurrentPage(1);
                                    setExpandedIssueId(issue.id);
                                }}
                            >
                                {issue.title}
                            </button>
                            <span>{issue.due}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 직원별 업무량 */}
            <div className="issue-workload-panel">
                <h3>담당자별 업무량</h3>
                <div className="issue-workload-grid">
                    {employeeWorkload.map(employee => (
                        <div className="issue-workload-item" key={employee.id}>
                            <span>{employee.name}</span>
                            <strong>{employee.count}건</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="issue-toolbar">
                <input
                    className="search"
                    placeholder="이슈 제목 검색"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShowRegister(!showRegister)}
                >
                    {showRegister ? "등록 취소" : "+ 이슈 등록"}
                </button>
            </div>
            {showRegister && (
                <form
                    className="panel issue-register-form"
                    onSubmit={addIssue}
                >
                    <h3>새 이슈 등록</h3>
                    <div className="form-row">
                        <input
                            placeholder="이슈 제목"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                        <select
                            value={projectId}
                            onChange={e => setProjectId(e.target.value)}
                        >
                            <option value="">프로젝트 미지정</option>
                            {projects.map(project => (
                                <option
                                    key={project.id}
                                    value={project.id}
                                >
                                    {project.title ||
                                        project.name ||
                                        project.project_title}
                                </option>
                            ))}
                        </select>
                        <select
                            value={assigneeId}
                            onChange={e => setAssigneeId(e.target.value)}
                        >
                            <option value="">담당자 미지정</option>
                            {employees.map(employee => (
                                <option
                                    key={employee.id}
                                    value={employee.id}
                                >
                                    {employee.name ||
                                        employee.employee_name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                        >
                            <option>낮음</option>
                            <option>보통</option>
                            <option>높음</option>
                            <option>긴급</option>
                        </select>
                        <input
                            type="date"
                            aria-label="마감일"
                            value={due}
                            onChange={e => setDue(e.target.value)}
                        />
                    </div>
                    <textarea
                        className="issue-textarea"
                        placeholder="이슈 상세 설명"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                    />
                    <textarea
                        className="issue-textarea"
                        placeholder="오류 재현 방법"
                        value={reproduction}
                        onChange={e => setReproduction(e.target.value)}
                        rows={3}
                    />
                    <button type="submit">
                        이슈 등록
                    </button>
                </form>
            )}
            <div className="issue-tabs">
                {[
                    "전체",
                    "접수",
                    "진행 중",
                    "검토 중",
                    "완료",
                    "재오픈"
                ].map(status => (
                    <button
                        type="button"
                        key={status}
                        className={
                            statusFilter === status
                                ? "active"
                                : "secondary"
                        }
                        onClick={() => {
                            setStatusFilter(status);
                            setCurrentPage(1);
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>
            <div className="panel issue-filter-panel">
                <div className="form-row">
                    <select
                        value={projectFilter}
                        onChange={e => {
                            setProjectFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="전체">전체 프로젝트</option>
                        <option value="미지정">프로젝트 미지정</option>
                        {projects.map(project => (
                            <option
                                key={project.id}
                                value={project.id}
                            >
                                {project.title ||
                                    project.name ||
                                    project.project_title}
                            </option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter}
                        onChange={e => {
                            setPriorityFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="전체">전체 중요도</option>
                        <option>낮음</option>
                        <option>보통</option>
                        <option>높음</option>
                        <option>긴급</option>
                    </select>
                    <select
                        value={assigneeFilter}
                        onChange={e => {
                            setAssigneeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="전체">전체 담당자</option>
                        <option value="미지정">담당자 미지정</option>
                        {employees.map(employee => (
                            <option
                                key={employee.id}
                                value={employee.id}
                            >
                                {employee.name ||
                                    employee.employee_name}
                            </option>
                        ))}
                    </select>
                </div>
                <p>검색 결과: {filtered.length}개</p>
            </div>
            {paginatedIssues.length === 0 && (
                <div className="panel">
                    <p>표시할 이슈가 없습니다.</p>
                </div>
            )}
            {paginatedIssues.map(issue => {
                const isExpanded = expandedIssueId === issue.id;
                const issueComments = issue.comments || [];
                const issueHistory = issue.history || [];
                const workLogs = issue.workLogs || [];
                // 이슈별 누적 작업 시간
                const totalWorkMinutes = workLogs.reduce(
                    (sum, log) =>
                        sum + Number(log.minutes || 0),
                    0
                );
                // 기록된 작업 시간에 예시 시간당 단가를 곱한다.
                const estimatedCost = Math.round(
                    (totalWorkMinutes / 60) * hourlyCost
                );
                return (
                    <article
                        className="panel issue-list-item"
                        key={issue.id}
                    >
                        <div
                            className={
                                "issue-list-header issue-border-" +
                                issue.priority
                            }
                            onClick={() =>
                                setExpandedIssueId(
                                    isExpanded ? null : issue.id
                                )
                            }
                        >
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
                                    <span
                                        className={
                                            "issue-status-badge " +
                                            getStatusClass(issue.status)
                                        }
                                    >
                                        {issue.status}
                                    </span>
                                    <span
                                        className={
                                            "pill issue-priority issue-priority-" +
                                            issue.priority
                                        }
                                    >
                                        {issue.priority}
                                    </span>
                                    {/* 기한 초과 표시 */}
                                    {issue.due &&
                                        issue.status !== "완료" &&
                                        issue.due < getToday() && (
                                            <span className="issue-overdue-badge">
                                                ⚠ 기한 초과
                                            </span>
                                        )}
                                </div>
                                {/* 프로젝트, 담당자, 마감일 */}
                                <p className="issue-meta">
                                    {projectName(issue.projectId)}
                                    {" · "}
                                    {employeeName(issue.assigneeId)}
                                    {" · "}
                                    마감 {issue.due || "미지정"}
                                </p>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="issue-expanded-content">
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
                                        <select
                                            value={issue.assigneeId || ""}
                                            onChange={e =>
                                                changeAssignee(
                                                    issue,
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">미지정</option>
                                            {employees.map(employee => (
                                                <option
                                                    key={employee.id}
                                                    value={employee.id}
                                                >
                                                    {employee.name ||
                                                        employee.employee_name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        마감일
                                        <input
                                            type="date"
                                            value={issue.due || ""}
                                            onChange={e =>
                                                updateIssue(
                                                    issue.id,
                                                    {
                                                        due: e.target.value
                                                    },
                                                    `${issue.title}: 마감일 변경`
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                {/* 마감일 초과 경고 */}
                                {issue.due &&
                                    issue.status !== "완료" &&
                                    issue.due < getToday() && (
                                        <p className="error">
                                            마감일이 지났습니다.
                                        </p>
                                    )}
                                <div className="issue-status-section">
                                    <h4>이슈 처리</h4>
                                    <p>
                                        현재 상태:{" "}
                                        <strong>{issue.status}</strong>
                                    </p>
                                    {issue.status === "검토 중" && (
                                        <input
                                            placeholder="검증 결과 또는 확인 내용"
                                            value={
                                                verificationComments[issue.id] || ""
                                            }
                                            onChange={e =>
                                                setVerificationComments(old => ({
                                                    ...old,
                                                    [issue.id]: e.target.value
                                                }))
                                            }
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => nextStatus(issue)}
                                    >
                                        {nextStatusLabel(issue.status)}
                                    </button>
                                    {issue.resolvedAt && (
                                        <p className="issue-meta">
                                            완료일: {issue.resolvedAt}
                                        </p>
                                    )}
                                </div>
                                <div className="issue-work-section">
                                    <h4>작업 시간 기록</h4>
                                    <input
                                        placeholder="작업 내용"
                                        value={
                                            workDescriptions[issue.id] || ""
                                        }
                                        onChange={e =>
                                            setWorkDescriptions(old => ({
                                                ...old,
                                                [issue.id]: e.target.value
                                            }))
                                        }
                                    />
                                    {/* 빠른 시간 선택 */}
                                    <div className="issue-time-buttons">
                                        {[15, 30, 60, 120].map(minutes => (
                                            <button
                                                type="button"
                                                key={minutes}
                                                className={
                                                    Number(workMinutes[issue.id]) === minutes
                                                        ? "active"
                                                        : "secondary"
                                                }
                                                onClick={() =>
                                                    selectWorkMinutes(
                                                        issue.id,
                                                        minutes
                                                    )
                                                }
                                            >
                                                {minutes < 60
                                                    ? `${minutes}분`
                                                    : `${minutes / 60}시간`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="form-row">
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="작업 시간(분)"
                                            value={
                                                workMinutes[issue.id] || ""
                                            }
                                            onChange={e =>
                                                setWorkMinutes(old => ({
                                                    ...old,
                                                    [issue.id]: e.target.value
                                                }))
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="secondary"
                                            onClick={() => addWorkLog(issue)}
                                        >
                                            작업 등록
                                        </button>
                                    </div>
                                    <p>
                                        총 작업 시간:{" "}
                                        {Math.floor(totalWorkMinutes / 60)}시간
                                        {" "}
                                        {totalWorkMinutes % 60}분
                                    </p>
                                    <p>
                                        예상 인건비 (시간당 20,000원): {estimatedCost.toLocaleString("ko-KR")}원
                                    </p>
                                    {/* 기존 작업 기록 */}
                                    {workLogs.map(log => (
                                        <p
                                            key={log.id}
                                            className="history"
                                        >
                                            {log.createdAt}
                                            {" · "}
                                            {log.description}
                                            {" · "}
                                            {log.minutes}분
                                        </p>
                                    ))}
                                </div>
                                <div className="issue-comment-section">
                                    <h4>요청사항 코멘트</h4>
                                    <div className="form-row">
                                        <input
                                            placeholder="요청사항 코멘트 작성"
                                            value={comments[issue.id] || ""}
                                            onChange={e =>
                                                setComments(old => ({
                                                    ...old,
                                                    [issue.id]: e.target.value
                                                }))
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="secondary"
                                            onClick={() => addComment(issue)}
                                        >
                                            요청사항 등록
                                        </button>
                                    </div>
                                    {/* 등록된 댓글 */}
                                    {issueComments.map((comment, index) => (
                                        <p
                                            key={comment.id || index}
                                            className="history"
                                        >
                                            {typeof comment === "string"
                                                ? comment
                                                : `${comment.createdAt} · ${comment.author}: ${comment.content}`}
                                        </p>
                                    ))}
                                </div>
                                <details>
                                    <summary>
                                        변경 이력 {issueHistory.length}개
                                    </summary>
                                    {issueHistory.map((history, index) => (
                                        <p
                                            key={index}
                                            className="history"
                                        >
                                            {history.at}
                                            {" · "}
                                            {history.userName || "작성자 미기록"}
                                            {" — "}
                                            {history.text}
                                        </p>
                                    ))}
                                </details>
                                {/* 이슈 삭제 */}
                                <div className="issue-delete-area">
                                    <button
                                        type="button"
                                        className="secondary"
                                        onClick={() => deleteIssue(issue)}
                                    >
                                        휴지통으로 이동
                                    </button>
                                </div>
                            </div>
                        )}
                    </article>
                );
            })}
            <div className="issue-pagination">
                <button
                    type="button"
                    className="secondary"
                    disabled={safeCurrentPage === 1}
                    onClick={() => {
                        setCurrentPage(safeCurrentPage - 1);
                        setExpandedIssueId(null);
                    }}
                >
                    이전
                </button>
                <span>
                    {safeCurrentPage} / {totalPages}
                </span>
                <button
                    type="button"
                    className="secondary"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => {
                        setCurrentPage(safeCurrentPage + 1);
                        setExpandedIssueId(null);
                    }}
                >
                    다음
                </button>
            </div>
            {/* 휴지통: 삭제한 이슈를 복구할 수 있다. */}
            <details className="issue-trash">
                <summary>임시 저장 ({deletedIssues.length}건)</summary>
                {deletedIssues.length === 0 && (
                    <p>이슈가 없습니다.</p>
                )}
                {deletedIssues.map(issue => (
                    <div className="issue-trash-item" key={issue.id}>
                        <div>
                            <strong>{issue.title}</strong>
                            <p>이동자: {issue.deletedBy || "미기록"}</p>
                            <p>이동 시각: {issue.deletedAt || "미기록"}</p>
                        </div>
                        <button type="button" onClick={() => restoreIssue(issue)}>
                            복구
                        </button>
                    </div>
                ))}
            </details>
        </section>
    );
}