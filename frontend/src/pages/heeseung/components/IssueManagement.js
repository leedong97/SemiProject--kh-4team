import SearchInput from "../../../shared/SearchInput";
import React, { useState, useEffect } from "react";
import "./IssueManagement.css";
import { erpRequest } from "../erpApi";
import IssueCompletion from "../../dong/IssueCompletion";
import { API_BASE } from "../../../shared/config";
export default function IssueManagement({
    data,
    changeData,
    currentUser
}) {
    // 부모 컴포넌트에서 로그인 사용자 정보를 전달한다.
    // 로그인 연동 전에는 임시 사용자로 표시한다.
    const loginUser = currentUser || {
        id: null,
        name: "임시 사용자"
    };
    const loginUserName = loginUser.name || loginUser.employee_name || "임시 사용자";

    // 1. 이슈 등록 입력값
    const [searchResetKey, setSearchResetKey] = useState(0);
    const [title, setTitle] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [due, setDue] = useState("");
    const [priority, setPriority] = useState("보통");
    const [search, setSearch] = useState("");
    const [comments, setComments] = useState({});
    const [savedComments, setSavedComments] = useState({});
    const [commentLoading, setCommentLoading] = useState({});
    const [commentBusy, setCommentBusy] = useState({});
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

    // 5. 이슈 처리 상태는 DB에서 조회한 값을 사용합니다.

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
                    reporterId: item.reporterId == null ? null : Number(item.reporterId),
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
    const projectMembers = data?.projectMembers || data?.project_members || [];

    // DB에서 프로젝트 참여자 목록을 직접 불러옵니다.
    const [dbMembers, setDbMembers] = useState([]);
    const [memberLoading, setMemberLoading] = useState(true);
    const [memberError, setMemberError] = useState("");

    useEffect(function () {
        let cancelled = false;

        fetch(API_BASE + "/api/dong/project-workload-members")
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("참여 직원 조회 실패 (" + response.status + ")");
                }
                return response.json();
            })
            .then(function (rows) {
                if (!cancelled) {
                    setDbMembers(Array.isArray(rows) ? rows : []);
                    setMemberError("");
                }
            })
            .catch(function (error) {
                if (!cancelled) {
                    setMemberError(error.message);
                }
            })
            .finally(function () {
                if (!cancelled) {
                    setMemberLoading(false);
                }
            });

        return function () {
            cancelled = true;
        };
    }, []);

    // 휴지통에 있는 이슈는 일반 화면에서 제외한다.
    const activeIssues = issues.filter(issue => !issue.deletedAt);
    const deletedIssues = issues.filter(issue => Boolean(issue.deletedAt));

    // 7. 고유 ID 생성

    function createId() {
        // 브라우저에서 고유 ID 생성 기능을 지원하면 사용한다.
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        // 지원하지 않는 브라우저에서는 시간과 난수를 조합한다.
        return Date.now().toString() + "-" + Math.random().toString(36).slice(2);
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
        const employee = employees.find(e => String(e.id ?? e.employee_id) === String(id));
        return employee?.name || employee?.employee_name || "미지정";
    }

    // 10. 프로젝트 이름 조회

    function projectName(id) {
        const project = (dbProjects.length ? dbProjects : projects).find(p => String(p.id ?? p.project_id) === String(id));
        return project?.title || project?.name || project?.project_title || "프로젝트 미지정";
    }

    // 11. 새로운 이슈 등록

    async function addIssue(event) {
        event.preventDefault();
        if (!title.trim()) {
            alert("이슈 제목을 입력하세요.");
            return;
        }
        if (!Number(projectId)) {
            alert('프로젝트를 선택하세요.');
            return;
        }
        try {
            const saved = await erpRequest('/issues', 'POST', {
                title: title.trim(),
                description: description.trim(),
                projectId: Number(projectId),
                assigneeId: assigneeId ? Number(assigneeId) : null,
                due: due || null,
                priority: priority
            });
            await loadIssues();
            setExpandedIssueId(Number(saved.id));
        } catch (error) {
            window.alert('이슈 DB 등록 실패: ' + error.message);
            return;
        }
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

        setSearch("");

        setSearchResetKey((key) => key + 1);
        setStatusFilter("전체");
        setPriorityFilter("전체");
        setAssigneeFilter("전체");
        setProjectFilter("전체");
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

    // 14. 요청사항 코멘트는 MySQL에 저장하고 이슈별로 다시 불러옵니다.
    async function loadIssueComments(issueId) {
        setCommentLoading(old => ({ ...old, [issueId]: true }));
        try {
            const rows = await erpRequest('/issues/' + issueId + '/comments');
            setSavedComments(old => ({ ...old, [issueId]: rows }));
        } catch (error) {
            window.alert('코멘트 조회 실패: ' + error.message);
        } finally {
            setCommentLoading(old => ({ ...old, [issueId]: false }));
        }
    }

    function toggleIssueDetails(issueId) {
        if (expandedIssueId === issueId) {
            setExpandedIssueId(null);
        } else {
            setExpandedIssueId(issueId);
            loadIssueComments(issueId);
        }
    }

    async function addComment(issue) {
        const message = (comments[issue.id] || '').trim();
        if (!message || commentBusy[issue.id]) return;
        if (message.length > 2000) {
            window.alert('코멘트는 2000자 이하로 입력하세요.');
            return;
        }
        setCommentBusy(old => ({ ...old, [issue.id]: true }));
        try {
            await erpRequest('/issues/' + issue.id + '/comments', 'POST', { content: message });
            setComments(old => ({ ...old, [issue.id]: '' }));
            await loadIssueComments(issue.id);
        } catch (error) {
            window.alert('코멘트 등록 실패: ' + error.message);
        } finally {
            setCommentBusy(old => ({ ...old, [issue.id]: false }));
        }
    }

    // 15. 이슈 상태 변경
    // 기존 PATCH API를 사용하여 MySQL에 상태를 저장합니다.
    function changeStatus(issue, newStatus) {
        if (issue.status === newStatus) {
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

    // 16. 완료된 이슈 재오픈 (기존 기능 유지)
    function reopenIssue(issue) {
        if (issue.status !== "완료") {
            alert("완료된 이슈만 재오픈할 수 있습니다.");
            return;
        }

        updateIssue(issue.id, {
            status: "재오픈"
        }, `${issue.title}: 이슈 재오픈`);
    }

    // 17. 이슈 상태에 맞게 다음 단계로 이동
    function nextStatus(issue) {
        if (issue.status === "접수" || issue.status === "재오픈") {
            changeStatus(issue, "진행 중");
            return;
        }

        if (issue.status === "검토 중" || issue.status === "검토중") {
            changeStatus(issue, "진행 중");
            return;
        }

        if (issue.status === "진행 중" || issue.status === "진행중") {
            // '검토 중으로 변경' 버튼을 누르면 검토 중 상태로 저장합니다.
            changeStatus(issue, "검토 중");
            return;
        }

        if (issue.status === "완료") {
            reopenIssue(issue);
        }
    }

    // 18. 현재 상태에 따라 버튼 문구를 변경
    function nextStatusLabel(status) {
        if (
            status === "접수" ||
            status === "재오픈" ||
            status === "검토 중" ||
            status === "검토중"
        ) {
            return "진행 중으로 변경";
        }

        if (status === "진행 중" || status === "진행중") {
            return "검토 중으로 변경";
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
    function deleteIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 임시 저장으로 이동하시겠습니까?`)) {
            return;
        }
        updateIssue(issue.id, {
            deletedAt: new Date().toISOString(),
            deletedBy: loginUserName,
            deletedById: loginUser.id
        }, `${issue.title}: 임시저장 이동`);
        setExpandedIssueId(null);
    }

    // 휴지통에서 복구한다. 기존 이력과 작업 기록은 유지된다.
    function restoreIssue(issue) {
        if (!window.confirm(`"${issue.title}" 이슈를 복구하시겠습니까?`)) {
            return;
        }
        updateIssue(issue.id, {
            deletedAt: null,
            deletedBy: null,
            deletedById: null
        }, `${issue.title}: 임시저장 복구`);
    }

    // 24. 이슈 요약 카드 계산

    const totalIssues = activeIssues.length;
    const ongoingIssues = activeIssues.filter(issue => issue.status === "진행 중").length;
    const urgentIssues = activeIssues.filter(issue => issue.priority === "긴급" && issue.status !== "완료").length;
    const overdueIssues = activeIssues.filter(issue => issue.due && issue.status !== "완료" && issue.due < getToday()).length;

    // 관리자가 우선 확인할 긴급 이슈
    const urgentIssueList = activeIssues.filter(issue => issue.priority === "긴급" && issue.status !== "완료");

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

    // 프로젝트 참여 직원 기준으로 업무량을 계산합니다.
    // 프로젝트 관리자가 직접 담당하는 프로젝트도 참여 프로젝트로 인정합니다.
    // DB에서 조회한 참여자 목록을 우선 사용합니다.
    // 서버 요청에 실패한 경우 기존 React 데이터로 계산합니다.
    const membersForWorkload = memberError
        ? employees.map(function (employee) {
            const employeeId = employee.id ?? employee.employee_id;
            const myProjectIds = [];

            projectMembers.forEach(function (member) {
                const memberId = member.employeeId ?? member.employee_id;
                const memberProjectId = member.projectId ?? member.project_id;
                if (String(memberId) === String(employeeId) && memberProjectId != null) {
                    myProjectIds.push(String(memberProjectId));
                }
            });

            projects.forEach(function (project) {
                const managerId = project.managerId ?? project.manager_id;
                const managedProjectId = project.id ?? project.project_id;
                if (String(managerId) === String(employeeId) && managedProjectId != null) {
                    myProjectIds.push(String(managedProjectId));
                }
            });

            return {
                id: employeeId,
                name: employee.name || employee.employee_name || "이름 없음",
                projectCount: new Set(myProjectIds).size
            };
        }).filter(function (employee) {
            return employee.projectCount > 0;
        })
        : dbMembers;

    const employeeWorkload = membersForWorkload.map(function (employee) {
        const employeeId = employee.id;
        const myIssues = activeIssues.filter(function (issue) {
            const issueEmployeeId = issue.assigneeId ?? issue.assignee_id;
            return String(issueEmployeeId) === String(employeeId) && issue.status !== "완료";
        });

        return {
            id: employeeId,
            name: employee.name,
            projectCount: Number(employee.projectCount),
            count: myIssues.length,
            urgent: myIssues.filter(function (issue) {
                return issue.priority === "긴급";
            }).length,
            overdue: myIssues.filter(function (issue) {
                return issue.due && issue.due < getToday();
            }).length
        };
    }).sort(function (a, b) {
        return b.count - a.count;
    });

    // 업무량 막대의 최대 길이를 계산합니다.
    const maxWorkload = Math.max(1, ...employeeWorkload.map(function (item) {
        return item.count;
    }));

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
        {/* 건의자별 업무량: 필요한 경우에만 열어 보는 간단한 목록 */}
        <details className="issue-workload-panel panel issue-optional-section">
            <summary>
                <span className="issue-workload-title">건의자별 업무량</span>
            </summary>
            <div className="issue-workload-body">
                {employeeWorkload.length === 0 ? <p className="issue-workload-empty">{memberLoading ? "프로젝트 참여 직원을 불러오는 중입니다." : memberError ? "참여 직원 조회 오류: " + memberError : "프로젝트 참여 직원이 없습니다. DB의 팀원 배정 정보를 확인해 주세요."}</p> : <div className="issue-workload-list">
                    {employeeWorkload.map(function (item) {
                        const selected = assigneeFilter === String(item.id);
                        return <button type="button" key={item.id} className={selected ? "issue-workload-row active" : "issue-workload-row"} aria-pressed={selected} onClick={function () {
                            setAssigneeFilter(String(item.id));
                            setCurrentPage(1);
                        }}>
                            <span className="issue-workload-person"><span className="issue-workload-name">{item.name}</span><span className="issue-workload-projects">프로젝트 {item.projectCount}개</span></span>
                            <span className="issue-workload-meter">
                                <span style={{
                                    width: item.count / maxWorkload * 100 + "%"
                                }} />
                            </span>
                            <strong className="issue-workload-count">{item.count}건</strong>
                            <span className="issue-workload-flags">
                                {item.urgent > 0 && <span className="issue-workload-urgent">긴급 {item.urgent}</span>}
                                {item.overdue > 0 && <span className="issue-workload-overdue">지연 {item.overdue}</span>}
                            </span>
                        </button>;
                    })}
                </div>}
                <div className="issue-workload-footer">
                    <span>이슈 건수이며 업무 난이도는 반영하지 않습니다.</span>
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
            <summary>긴급 · 마감 임박 이슈</summary>
            <div className="issue-alert-grid">
                <div className="issue-alert-panel">
                    <h3>긴급 이슈</h3>
                    <p>우선 처리할 이슈 {urgentIssueList.length}건</p>
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
                        <strong>
                            {issue.assigneeName || employeeName(issue.assigneeId)}
                        </strong>
                    </div>)}
                </div>
                <div className="issue-alert-panel">
                    <h3>마감 임박</h3>
                    <p>오늘부터 3일 이내 {upcomingIssues.length}건</p>
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
        <details className="issue-workload-panel panel issue-optional-section">
            <summary>이슈 완료 요청 검토</summary>

            <IssueCompletion admin onReviewed={() => loadIssues()} />
        </details>
        <div className="issue-toolbar">
            <SearchInput key={searchResetKey} className="search" placeholder="이슈 제목 검색" value={search} onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
            }} />
            <button type="button" onClick={() => setShowRegister(!showRegister)}>
                {showRegister ? "등록 취소" : "+ 이슈 등록"}
            </button>
        </div>
        {showRegister && <form className="panel issue-register-form" onSubmit={addIssue}>
            <h3>새 이슈 등록</h3>
            <div className="form-row">
                <input placeholder="이슈 제목" value={title} onChange={e => setTitle(e.target.value)} required />
                <select value={projectId} onChange={e => setProjectId(e.target.value)}>
                    <option value="">프로젝트를 선택하세요</option>
                    {(dbProjects.length ? dbProjects : projects).map(project => <option key={project.project_id || project.id} value={project.project_id || project.id}>
                        {project.project_title || project.title || project.name}
                    </option>)}
                </select>
                <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                    <option value="">담당자 미지정</option>
                    {employees.map(employee => <option key={employee.id || employee.employee_id} value={employee.id || employee.employee_id}>
                        {employee.name || employee.employee_name}
                    </option>)}
                </select>
                <select value={priority} onChange={e => setPriority(e.target.value)}>
                    <option>낮음</option>
                    <option>보통</option>
                    <option>높음</option>
                    <option>긴급</option>
                </select>
                <input type="date" aria-label="마감일" value={due} onChange={e => setDue(e.target.value)} />
            </div>
            <textarea className="issue-textarea" placeholder="이슈 상세 설명" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            <textarea className="issue-textarea" placeholder="오류 재현 방법" value={reproduction} onChange={e => setReproduction(e.target.value)} rows={3} />
            <button type="submit">
                이슈 등록
            </button>
        </form>}
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
                    <option value="전체">전체 건의자</option>
                    <option value="미지정">건의자 미지정</option>
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
            const issueComments = savedComments[issue.id] || [];
            const issueHistory = issue.history || [];
            return <article className="panel issue-list-item" key={issue.id}>
                <div className={"issue-list-header issue-border-" + issue.priority} onClick={() => toggleIssueDetails(issue.id)}>
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
                            <div><span>건의자</span><strong>{issue.reporterName || employeeName(issue.reporterId)}</strong></div>
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
                            건의자
                            <strong>{issue.reporterName || employeeName(issue.reporterId)}</strong>
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
                    {/* 이슈 처리: 상태에 따라 버튼 하나만 표시 */}
                    <div className="issue-status-section">
                        <h4>이슈 처리</h4>
                        <p>
                            현재 상태:{" "}
                            <strong>{issue.status}</strong>
                        </p>

                        <button
                            type="button"
                            onClick={() => nextStatus(issue)}
                            disabled={
                                ![
                                    "접수", "재오픈", "검토 중", "검토중",
                                    "진행 중", "진행중", "완료"
                                ].includes(issue.status)
                            }
                        >
                            {nextStatusLabel(issue.status)}
                        </button>

                        {issue.resolvedAt && (
                            <p className="issue-meta">
                                완료일: {issue.resolvedAt}
                            </p>
                        )}
                    </div>
                    <div className="issue-comment-section">
                        <h4>요청사항 코멘트</h4>
                        <div className="form-row">
                            <input placeholder="요청사항 코멘트 작성" value={comments[issue.id] || ""} onChange={e => setComments(old => ({
                                ...old,
                                [issue.id]: e.target.value
                            }))} />
                            <button type="button" className="secondary" disabled={commentBusy[issue.id] || !String(comments[issue.id] || '').trim()} onClick={() => addComment(issue)}>
                                {commentBusy[issue.id] ? '등록 중...' : '요청사항 등록'}
                            </button>
                        </div>
                        {/* DB에 저장된 코멘트만 표시합니다. 새로고침 후에도 유지됩니다. */}
                        {commentLoading[issue.id] && <p className="history">코멘트를 불러오는 중...</p>}
                        {!commentLoading[issue.id] && issueComments.length === 0 && <p className="history">등록된 요청사항 코멘트가 없습니다.</p>}
                        {issueComments.map(comment => <p key={comment.id} className="history">
                            {comment.createdAt} · {comment.author}: {comment.content}
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
                            휴지통으로 이동
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
