import React, { useState } from "react";
import "./HRManagement.css";

// 인사 관리 컴포넌트
export default function HRManagement({
    data,
    changeData
}) {
    // 현재 선택한 탭: 직원 관리 / 업무 관리 / 휴가 관리 / 통계 분석
    const [activeTab, setActiveTab] = useState("employees");

    // 직원 등록 입력값
    const [name, setName] = useState("");
    const [team, setTeam] = useState("개발팀");
    const [position, setPosition] = useState("");
    const [rank, setRank] = useState("사원");

    // 휴가 신청 입력값
    const [leaveEmployee, setLeaveEmployee] = useState("");
    const [leaveStart, setLeaveStart] = useState("");
    const [leaveEnd, setLeaveEnd] = useState("");

    // 담당 업무 등록 입력값
    const [taskEmployee, setTaskEmployee] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [taskStart, setTaskStart] = useState("");
    const [taskEnd, setTaskEnd] = useState("");
    const [taskDescription, setTaskDescription] = useState("");

    // 상위 컴포넌트에서 받은 데이터
    const employees = data?.employees || [];
    const issues = data?.issues || [];
    const tasks = data?.tasks || [];
    const leaves = data?.leaves || [];

    // 추가 기능: 직원 검색, 정렬, 수정, 퇴사, 프로젝트 조회
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("전체");
    const [employeeSort, setEmployeeSort] = useState("name");
    const [showRetired, setShowRetired] = useState(true);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editTeam, setEditTeam] = useState("");
    const [editRank, setEditRank] = useState("");
    const [editSalary, setEditSalary] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [detailTab, setDetailTab] = useState("summary");
    const evaluations = data?.evaluations || [];
    const projects = data?.projects || [];
    const projectMembers = data?.projectMembers || data?.project_members || [];
    const employeeChangeHistory = data?.employeeChangeHistory || [];

    // 인사 정보 변경 이력은 ERP 상위 상태에 기록합니다.
    function createEmployeeHistory(employeeId, action, before, after) {
        return {
            id: Date.now() + "-" + Math.random().toString(36).slice(2),
            employeeId: employeeId,
            action: action,
            before: before,
            after: after,
            changedAt: new Date().toISOString()
        };
    }

    // 직원의 고유번호를 문자열로 비교하여 숫자/문자열 ID 차이를 방지합니다.
    function sameId(a, b) {
        return String(a) === String(b);
    }

    // 직원 이름/부서 필터를 적용하고 정렬합니다. 원본 배열은 변경하지 않습니다.
    const departments = [...new Set(employees.map(x => x.team || x.department || "미지정"))];
    const filteredEmployees = employees.filter(employee => {
        const keyword = employeeSearch.trim().toLowerCase();
        const nameMatch = String(employee.name || "").toLowerCase().includes(keyword);
        const teamMatch = departmentFilter === "전체" || (employee.team || employee.department || "미지정") === departmentFilter;
        return nameMatch && teamMatch && (showRetired || employee.status !== "퇴사");
    }).sort((a, b) => {
        if (employeeSort === "salaryDesc") return Number(b.salary || 0) - Number(a.salary || 0);
        if (employeeSort === "hireDesc") return String(b.hireDate || "").localeCompare(String(a.hireDate || ""));
        if (employeeSort === "rank") return String(a.rank || "").localeCompare(String(b.rank || ""), "ko");
        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
    });

    // 수정할 직원을 선택하면 현재 값을 입력칸에 채웁니다.
    function startEmployeeEdit(employee) {
        setEditingEmployee(employee);
        setEditTeam(employee.team || employee.department || "");
        setEditRank(employee.rank || "사원");
        setEditSalary(employee.salary == null ? "" : String(employee.salary));
    }

    // 직원 정보를 수정합니다. 기존 직원의 다른 속성은 그대로 보존합니다.
    function saveEmployeeEdit(event) {
        event.preventDefault();
        if (!editingEmployee || !editTeam.trim()) return;
        if (editSalary !== "" && (!Number.isFinite(Number(editSalary)) || Number(editSalary) < 0)) {
            window.alert("연봉은 0 이상의 숫자로 입력하세요.");
            return;
        }
        changeData("직원 정보 수정", old => ({
            ...old,
            employees: (old.employees || []).map(employee => sameId(employee.id, editingEmployee.id) ? {
                ...employee,
                team: editTeam.trim(),
                rank: editRank,
                salary: editSalary === "" ? null : Number(editSalary)
            } : employee),
            employeeChangeHistory: [...(old.employeeChangeHistory || []), createEmployeeHistory(editingEmployee.id, "직원 정보 수정", {
                team: editingEmployee.team,
                rank: editingEmployee.rank,
                salary: editingEmployee.salary
            }, {
                team: editTeam.trim(),
                rank: editRank,
                salary: editSalary === "" ? null : Number(editSalary)
            })]
        }));
        setEditingEmployee(null);
    }

    // 퇴사자는 삭제하지 않고 상태와 퇴사일을 남깁니다.
    function retireEmployee(employee) {
        if (employee.status === "퇴사") return;
        if (!window.confirm(employee.name + " 직원을 퇴사 처리하시겠습니까?")) return;
        changeData("직원 퇴사 처리", old => ({
            ...old,
            employees: (old.employees || []).map(item => sameId(item.id, employee.id) ? {
                ...item,
                status: "퇴사",
                retirementDate: getToday()
            } : item),
            employeeChangeHistory: [...(old.employeeChangeHistory || []), createEmployeeHistory(employee.id, "퇴사 처리", {
                status: employee.status
            }, {
                status: "퇴사"
            })]
        }));
    }

    // 프로젝트의 담당자 또는 프로젝트 구성원 목록에서 참여 정보를 찾습니다.
    function getEmployeeProjects(employee) {
        return projects.filter(project => sameId(project.managerId || project.manager_id, employee.id) || projectMembers.some(member => sameId(member.projectId || member.project_id, project.id || project.project_id) && sameId(member.employeeId || member.employee_id, employee.id)));
    }

    // 두 날짜 구간이 겹치는지 확인
    function overlaps(aStart, aEnd, bStart, bEnd) {
        if (!aStart || !aEnd || !bStart || !bEnd) {
            return false;
        }
        return aStart <= bEnd && bStart <= aEnd;
    }

    // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
    function getToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    }

    // 오늘부터 7일 뒤 날짜를 반환
    function getSevenDaysLater() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
    }

    // 마감일까지 7일 이하 남았는지 검사
    function isDueSoon(endDate) {
        if (!endDate) {
            return false;
        }
        return endDate >= getToday() && endDate <= getSevenDaysLater();
    }

    // 직원 등록
    function addEmployee(event) {
        event.preventDefault();
        if (!name.trim()) {
            window.alert("직원 이름을 입력하세요.");
            return;
        }

        // 같은 팀의 동명이인 확인
        const duplicateEmployee = employees.some(employee => employee.name === name.trim() && employee.team === team && employee.status !== "퇴사");
        if (duplicateEmployee) {
            const confirmed = window.confirm("같은 팀에 동일한 이름의 직원이 있습니다.\n" + "그래도 등록하시겠습니까?");
            if (!confirmed) {
                return;
            }
        }
        const employee = {
            id: Date.now(),
            name: name.trim(),
            team: team,
            position: position.trim(),
            role: position.trim(),
            rank: rank,
            status: "재직"
        };
        changeData("직원 등록: " + employee.name, old => ({
            ...old,
            employees: [...(old.employees || []), employee]
        }));
        setName("");
        setPosition("");
        window.alert("직원이 등록되었습니다.");
    }

    // 담당 업무 등록
    function addTask(event) {
        event.preventDefault();
        if (!taskEmployee || !taskTitle.trim() || !taskStart || !taskEnd || taskStart > taskEnd) {
            window.alert("담당 업무와 날짜를 확인하세요.");
            return;
        }
        const employeeId = Number(taskEmployee);
        const employee = employees.find(x => x.id === employeeId);
        if (!employee || employee.status === "퇴사") {
            window.alert("업무를 배정할 수 없는 직원입니다.");
            return;
        }

        // 해당 직원의 휴가와 업무 날짜 비교
        const conflictingLeaves = leaves.filter(leave => leave.employeeId === employeeId && leave.status !== "반려" && overlaps(taskStart, taskEnd, leave.startDate || leave.date, leave.endDate || leave.date));
        if (conflictingLeaves.length > 0) {
            const details = conflictingLeaves.map(leave => (leave.startDate || leave.date) + " ~ " + (leave.endDate || leave.date) + " (" + leave.status + ")").join("\n");
            const confirmed = window.confirm("휴가 일정과 겹칩니다.\n\n" + details + "\n\n그래도 업무를 등록할까요?");
            if (!confirmed) {
                return;
            }
        }
        changeData("담당 업무 등록", old => ({
            ...old,
            tasks: [{
                id: Date.now(),
                employeeId: employeeId,
                title: taskTitle.trim(),
                startDate: taskStart,
                endDate: taskEnd,
                description: taskDescription,
                status: "예정"
            }, ...(old.tasks || [])]
        }));
        setTaskTitle("");
        setTaskStart("");
        setTaskEnd("");
        setTaskDescription("");
        window.alert("담당 업무가 등록되었습니다.");
    }

    // 담당 업무 상태 변경
    function changeTaskStatus(id, status) {
        changeData("담당 업무 상태 변경", old => ({
            ...old,
            tasks: (old.tasks || []).map(task => task.id === id ? {
                ...task,
                status: status
            } : task)
        }));
    }

    // 휴가 신청
    function requestLeave(event) {
        event.preventDefault();
        if (!leaveEmployee || !leaveStart || !leaveEnd || leaveStart > leaveEnd) {
            window.alert("휴가 기간을 확인하세요.");
            return;
        }
        const employeeId = Number(leaveEmployee);
        const employee = employees.find(x => x.id === employeeId);
        if (!employee || employee.status === "퇴사") {
            window.alert("휴가를 신청할 수 없는 직원입니다.");
            return;
        }

        // 기존 휴가와 기간이 겹치는지 확인
        const duplicateLeave = leaves.some(leave => leave.employeeId === employeeId && leave.status !== "반려" && overlaps(leaveStart, leaveEnd, leave.startDate || leave.date, leave.endDate || leave.date));
        if (duplicateLeave) {
            window.alert("이미 신청한 휴가 기간과 겹칩니다.");
            return;
        }

        // 휴가 기간과 담당 업무 비교
        const conflictingTasks = tasks.filter(task => task.employeeId === employeeId && task.status !== "완료" && overlaps(leaveStart, leaveEnd, task.startDate, task.endDate));
        if (conflictingTasks.length > 0) {
            const details = conflictingTasks.map(task => task.title + " (" + task.startDate + " ~ " + task.endDate + ")").join("\n");
            const confirmed = window.confirm("휴가 기간에 담당 업무가 있습니다.\n\n" + details + "\n\n그래도 신청하시겠습니까?");
            if (!confirmed) {
                return;
            }
        }
        const leave = {
            id: Date.now(),
            employeeId: employeeId,
            startDate: leaveStart,
            endDate: leaveEnd,
            status: "대기"
        };
        changeData("휴가 신청 등록", old => ({
            ...old,
            leaves: [leave, ...(old.leaves || [])]
        }));
        setLeaveStart("");
        setLeaveEnd("");
        window.alert("휴가 신청이 등록되었습니다.");
    }

    // 휴가 승인 또는 반려
    function approveLeave(id, status) {
        const leave = leaves.find(x => x.id === id);
        if (!leave || leave.status !== "대기") {
            window.alert("처리할 수 없는 휴가입니다.");
            return;
        }
        const confirmed = window.confirm("휴가를 " + status + " 처리하시겠습니까?");
        if (!confirmed) {
            return;
        }
        changeData("휴가 " + status, old => ({
            ...old,
            leaves: (old.leaves || []).map(x => x.id === id && x.status === "대기" ? {
                ...x,
                status: status
            } : x)
        }));
    }

    // 화면 출력
    return <section className="hr-management">

                                                {/* 페이지 제목 */}
                                                <div className="section-head">

                                                                <div>
                                                                                <span className="hr-eyebrow">
                                                                                                WORKSPACE / HUMAN RESOURCES
                                                                                </span>

                                                                                <h2>인사 관리</h2>

                                                                                <p>
                                                                                                직원 등록 · 업무량 · 휴가 승인
                                                                                </p>
                                                                </div>

                                                </div>

                                                {/* 화면별 기능을 분리해 필요한 정보에 집중할 수 있도록 탭을 구성합니다. */}
                                                <nav className="hr-tabs" aria-label="인사 관리 메뉴">
                                                                {[{
                id: "employees",
                label: "직원 관리"
            }, {
                id: "tasks",
                label: "업무 관리"
            }, {
                id: "leaves",
                label: "휴가 관리"
            }, {
                id: "analytics",
                label: "통계 분석"
            }].map(tab => <button key={tab.id} type="button" className={activeTab === tab.id ? "hr-tab active" : "hr-tab"} aria-current={activeTab === tab.id ? "page" : undefined} onClick={() => setActiveTab(tab.id)}>
                                                                                                {tab.label}
                                                                                </button>)}
                                                </nav>

                                                {/* 직원 관리: 직원 목록, 검색/정렬, 정보 수정, 등록, 퇴사 처리 */}
                                                {activeTab === "employees" && <div className="hr-tab-content">
                                                                {/* 추가 기능: 검색/정렬/수정/퇴사/참여 프로젝트/업무량 */}
                                                                <div className="panel hr-enhanced">
                                                                                <div className="hr-enhanced-heading">
                                                                                                <div><h3>직원 통합 관리</h3><p className="muted">직원 정보, 프로젝트 참여, 업무량을 한 화면에서 확인합니다.</p></div>
                                                                                                <span className="hr-total">전체 {employees.length}명 · 재직 {employees.filter(x => x.status !== "퇴사").length}명</span>
                                                                                </div>
                                                                                <div className="hr-filters">
                                                                                                <input aria-label="직원 이름 검색" placeholder="직원 이름 검색" value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} />
                                                                                                <select aria-label="부서 필터" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
                                                                                                                <option value="전체">전체 부서</option>
                                                                                                                {departments.map(x => <option key={x} value={x}>{x}</option>)}
                                                                                                </select>
                                                                                                <select aria-label="직원 정렬" value={employeeSort} onChange={e => setEmployeeSort(e.target.value)}>
                                                                                                                <option value="name">이름순</option>
                                                                                                                <option value="rank">직급순</option>
                                                                                                                <option value="hireDesc">입사일 최신순</option>
                                                                                                                <option value="salaryDesc">연봉 높은순</option>
                                                                                                </select>
                                                                                                <label className="hr-retired-toggle"><input type="checkbox" checked={showRetired} onChange={e => setShowRetired(e.target.checked)} /> 퇴사자 포함</label>
                                                                                </div>
                                                                                <div className="hr-table-wrap"><table className="hr-staff-table">
                                                                                                <thead><tr><th>이름</th><th>부서</th><th>직급</th><th>연봉</th><th>입사일</th><th>상태</th><th>관리</th></tr></thead>
                                                                                                <tbody>{filteredEmployees.map(employee => <tr key={employee.id}>
                                                                                                                <td>{employee.name}</td><td>{employee.team || employee.department || "-"}</td>
                                                                                                                <td>{employee.rank || "-"}</td>
                                                                                                                <td>{employee.salary == null ? "미등록" : Number(employee.salary).toLocaleString("ko-KR") + "원"}</td>
                                                                                                                <td>{employee.hireDate || "-"}</td>
                                                                                                                <td><span className={employee.status === "퇴사" ? "hr-retired" : "hr-active"}>{employee.status || "재직"}</span>{employee.status === "퇴사" && employee.retirementDate ? <small> {employee.retirementDate}</small> : null}</td>
                                                                                                                <td><div className="hr-inline-actions">
                                                                                                                                <button type="button" onClick={() => {
                                            setSelectedEmployeeId(String(employee.id));
                                            setDetailTab("summary");
                                        }}>상세</button>
                                                                                                                                {employee.status !== "퇴사" && <><button type="button" onClick={() => startEmployeeEdit(employee)}>수정</button><button type="button" className="hr-danger-button" onClick={() => retireEmployee(employee)}>퇴사</button></>}
                                                                                                                </div></td>
                                                                                                </tr>)}
                                                                                                                {filteredEmployees.length === 0 && <tr><td colSpan="7">조건에 맞는 직원이 없습니다.</td></tr>}
                                                                                                </tbody></table></div>
                                                                                {editingEmployee && <form className="hr-edit-form" onSubmit={saveEmployeeEdit}>
                                                                                                <h4>{editingEmployee.name} 직원 정보 수정</h4>
                                                                                                <label>부서<input value={editTeam} onChange={e => setEditTeam(e.target.value)} required /></label>
                                                                                                <label>직급<select value={editRank} onChange={e => setEditRank(e.target.value)}>{["사원", "대리", "과장", "차장", "팀장", "부장", "이사", "대표"].map(x => <option key={x}>{x}</option>)}</select></label>
                                                                                                <label>연봉 (원)<input type="number" min="0" value={editSalary} onChange={e => setEditSalary(e.target.value)} placeholder="미등록" /></label>
                                                                                                <button type="submit">저장</button><button type="button" onClick={() => setEditingEmployee(null)}>취소</button>
                                                                                </form>}
                                                                                {/* 직원 상세: 기존 목록은 유지하고 선택한 직원의 연결 데이터를 표시합니다. */}
                                                                                {selectedEmployeeId !== "" && employees.filter(employee => sameId(employee.id, selectedEmployeeId)).map(employee => {
                    const employeeProjects = getEmployeeProjects(employee);
                    const employeeIssues = issues.filter(issue => sameId(issue.assigneeId ?? issue.assignee_id, employee.id));
                    const employeeTasks = tasks.filter(task => sameId(task.employeeId ?? task.employee_id, employee.id));
                    const overdueTasks = employeeTasks.filter(task => task.status !== "완료" && (task.endDate || task.end_date) && String(task.endDate || task.end_date).slice(0, 10) < getToday());
                    const completedIssues = employeeIssues.filter(issue => ["완료", "해결", "종료", "closed", "resolved"].includes(String(issue.status || "").toLowerCase()));
                    const employeeEvaluations = evaluations.filter(item => sameId(item.employeeId ?? item.employee_id ?? item.targetEmployeeId, employee.id));
                    const sortedEvaluations = [...employeeEvaluations].sort((first, second) => String(second.period || second.createdAt || second.created_at || "").localeCompare(String(first.period || first.createdAt || first.created_at || "")));
                    const latestEvaluation = sortedEvaluations[0];
                    const appealEvaluations = employeeEvaluations.filter(item => item.appeal || item.appealStatus);
                    const employeeHistory = employeeChangeHistory.filter(item => sameId(item.employeeId, employee.id));
                    return <section className="hr-employee-detail" key={employee.id} aria-label={employee.name + " 직원 상세 정보"}>
                                                                                                                                <div className="hr-detail-header">
                                                                                                                                                <div className="hr-detail-profile">
                                                                                                                                                                <div className="hr-detail-avatar" aria-hidden="true">{String(employee.name || "직원").slice(0, 1)}</div>
                                                                                                                                                                <div>
                                                                                                                                                                                <span className="hr-detail-kicker">EMPLOYEE PROFILE</span>
                                                                                                                                                                                <h4>{employee.name} <span>{employee.rank || employee.position || "직급 미등록"}</span></h4>
                                                                                                                                                                                <p>{employee.team || employee.department || "부서 미등록"} · {employee.status || "재직"}</p>
                                                                                                                                                                </div>
                                                                                                                                                </div>
                                                                                                                                                <button type="button" className="hr-detail-close" onClick={() => setSelectedEmployeeId("")}>상세 닫기</button>
                                                                                                                                </div>

                                                                                                                                <div className="hr-detail-tabs" role="tablist" aria-label="직원 상세 메뉴">
                                                                                                                                                {[["summary", "통합 정보"], ["personnel", "인사 정보"], ["projects", "프로젝트 참여"], ["work", "업무/이슈"], ["evaluation", "평가 이력"], ["appeals", "이의신청"]].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={detailTab === id} className={detailTab === id ? "active" : ""} onClick={() => setDetailTab(id)}>
                                                                                                                                                                                {label}
                                                                                                                                                                </button>)}
                                                                                                                                </div>

                                                                                                                                {employeeHistory.length > 0 && <details className="hr-history-panel">
                                                                                                                                                                <summary>인사 정보 변경 이력 ({employeeHistory.length}건)</summary>
                                                                                                                                                                <ul>{employeeHistory.slice().reverse().map(item => <li key={item.id}>{new Date(item.changedAt).toLocaleString("ko-KR")} · {item.action}</li>)}</ul>
                                                                                                                                                </details>}
                                                                                                                                {detailTab === "summary" && <div className="hr-detail-content" role="tabpanel">
                                                                                                                                                                <div className="hr-stat-grid">
                                                                                                                                                                                <div>참여 프로젝트<strong>{employeeProjects.length}개</strong></div>
                                                                                                                                                                                <div>담당 이슈<strong>{employeeIssues.length}건</strong></div>
                                                                                                                                                                                <div>완료 이슈<strong>{completedIssues.length}건</strong></div>
                                                                                                                                                                                <div>기한 초과 업무<strong>{overdueTasks.length}건</strong></div>
                                                                                                                                                                </div>
                                                                                                                                                                <div className="hr-detail-summary-grid">
                                                                                                                                                                                <div className="hr-detail-info-card">
                                                                                                                                                                                                <h5>최근 직원 평가</h5>
                                                                                                                                                                                                {latestEvaluation ? <>
                                                                                                                                                                                                                                <strong>{latestEvaluation.totalScore ?? latestEvaluation.score ?? "점수 미등록"}{latestEvaluation.totalScore != null || latestEvaluation.score != null ? "점" : ""}</strong>
                                                                                                                                                                                                                                <p>{latestEvaluation.period || latestEvaluation.createdAt || "기간 미등록"} · {latestEvaluation.status || "상태 미등록"}</p>
                                                                                                                                                                                                                </> : <p className="hr-detail-empty">등록된 평가가 없습니다.</p>}
                                                                                                                                                                                </div>
                                                                                                                                                                                <div className="hr-detail-info-card">
                                                                                                                                                                                                <h5>업무 진행 현황</h5>
                                                                                                                                                                                                <strong>{employeeTasks.filter(task => task.status !== "완료").length}건 진행 중</strong>
                                                                                                                                                                                                <p>담당 업무 {employeeTasks.length}건 · 평가 이력 {employeeEvaluations.length}건</p>
                                                                                                                                                                                </div>
                                                                                                                                                                </div>
                                                                                                                                                </div>}

                                                                                                                                {detailTab === "personnel" && <div className="hr-detail-content hr-detail-fields" role="tabpanel">
                                                                                                                                                                {[["이름", employee.name], ["부서", employee.team || employee.department], ["직급", employee.rank || employee.position], ["입사일", employee.hireDate || employee.hire_date], ["재직 상태", employee.status || "재직"], ["퇴사일", employee.retirementDate]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "미등록"}</strong></div>)}
                                                                                                                                                </div>}

                                                                                                                                {detailTab === "projects" && <div className="hr-detail-content" role="tabpanel">
                                                                                                                                                                <h5>참여 프로젝트 <span>{employeeProjects.length}개</span></h5>
                                                                                                                                                                {employeeProjects.length === 0 ? <p className="hr-detail-empty">등록된 프로젝트 참여 정보가 없습니다.</p> : <ul className="hr-detail-records">
                                                                                                                                                                                                {employeeProjects.map((project, index) => <li key={project.id || project.project_id || index}>
                                                                                                                                                                                                                                <strong>{project.name || project.project_title || project.title || "프로젝트"}</strong>
                                                                                                                                                                                                                                <span>{project.status || "상태 미등록"}</span>
                                                                                                                                                                                                                </li>)}
                                                                                                                                                                                </ul>}
                                                                                                                                                </div>}

                                                                                                                                {detailTab === "work" && <div className="hr-detail-content" role="tabpanel">
                                                                                                                                                                <h5>담당 업무 <span>{employeeTasks.length}건</span></h5>
                                                                                                                                                                {employeeTasks.length === 0 ? <p className="hr-detail-empty">담당 업무가 없습니다.</p> : <ul className="hr-detail-records">
                                                                                                                                                                                                {employeeTasks.map((task, index) => <li key={task.id || index}><strong>{task.title || task.name || "업무"}</strong><span>{task.status || "미등록"}</span></li>)}
                                                                                                                                                                                </ul>}
                                                                                                                                                                <h5>담당 이슈 <span>{employeeIssues.length}건</span></h5>
                                                                                                                                                                {employeeIssues.length === 0 ? <p className="hr-detail-empty">담당 이슈가 없습니다.</p> : <ul className="hr-detail-records">
                                                                                                                                                                                                {employeeIssues.map((issue, index) => <li key={issue.id || issue.issue_id || index}><strong>{issue.title || issue.issue_title || "이슈"}</strong><span>{issue.status || "미등록"}</span></li>)}
                                                                                                                                                                                </ul>}
                                                                                                                                                </div>}

                                                                                                                                {detailTab === "evaluation" && <div className="hr-detail-content" role="tabpanel">
                                                                                                                                                                <h5>평가 이력 <span>{sortedEvaluations.length}건</span></h5>
                                                                                                                                                                {sortedEvaluations.length === 0 ? <p className="hr-detail-empty">평가 기록이 없습니다.</p> : <ul className="hr-detail-records">
                                                                                                                                                                                                {sortedEvaluations.map((item, index) => <li key={item.id || index}>
                                                                                                                                                                                                                                <strong>{item.period || item.createdAt || "평가 기간 미등록"}</strong>
                                                                                                                                                                                                                                <span>{item.totalScore ?? item.score ?? "점수 미등록"} · {item.status || "상태 미등록"}</span>
                                                                                                                                                                                                                </li>)}
                                                                                                                                                                                </ul>}
                                                                                                                                                </div>}

                                                                                                                                {detailTab === "appeals" && <div className="hr-detail-content" role="tabpanel">
                                                                                                                                                                <h5>평가 이의신청 <span>{appealEvaluations.length}건</span></h5>
                                                                                                                                                                {appealEvaluations.length === 0 ? <p className="hr-detail-empty">이의신청 기록이 없습니다.</p> : <ul className="hr-detail-records">
                                                                                                                                                                                                {appealEvaluations.map((item, index) => <li key={item.id || index}>
                                                                                                                                                                                                                                <strong>{item.period || "평가 기간 미등록"}</strong>
                                                                                                                                                                                                                                <span>{item.appealStatus || item.appeal?.status || "이의신청"}</span>
                                                                                                                                                                                                                </li>)}
                                                                                                                                                                                </ul>}
                                                                                                                                                </div>}
                                                                                                                </section>;
                })}

                                                                </div>
                                                                {/* 직원 등록 */}
                                                                <form className="panel form-row" onSubmit={addEmployee}>

                                                                                <h3 className="full">
                                                                                                신규 직원 등록
                                                                                </h3>

                                                                                <input placeholder="직원 이름" value={name} onChange={e => setName(e.target.value)} required />

                                                                                <input placeholder="직무" value={position} onChange={e => setPosition(e.target.value)} />

                                                                                <select value={rank} onChange={e => setRank(e.target.value)}>

                                                                                                {["사원", "대리", "과장", "차장", "팀장", "부장", "이사", "대표"].map(x => <option key={x}>{x}</option>)}

                                                                                </select>

                                                                                <select value={team} onChange={e => setTeam(e.target.value)}>
                                                                                                <option>개발팀</option>
                                                                                                <option>기획팀</option>
                                                                                                <option>디자인팀</option>
                                                                                                <option>운영팀</option>
                                                                                </select>

                                                                                <button type="submit">
                                                                                                직원 등록
                                                                                </button>

                                                                </form>
                                                </div>}

                                                {/* 업무 관리: 직원별 담당 업무 등록 및 상태 변경 */}
                                                {activeTab === "tasks" && <div className="hr-tab-content">
                                                                {/* 담당 업무 등록 */}
                                                                <form className="panel form-row" onSubmit={addTask}>

                                                                                <h3 className="full">
                                                                                                직원 담당 업무 등록 (프로젝트 이슈와 별도)
                                                                                </h3>

                                                                                <select required value={taskEmployee} onChange={e => setTaskEmployee(e.target.value)}>

                                                                                                <option value="">직원 선택</option>

                                                                                                {employees.map(employee => <option key={employee.id} value={employee.id} disabled={employee.status === "퇴사"}>
                                                                                                                                {employee.name}
                                                                                                                </option>)}

                                                                                </select>

                                                                                <input required placeholder="담당 업무명" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />

                                                                                <label>
                                                                                                시작일
                                                                                                <input required type="date" value={taskStart} onChange={e => setTaskStart(e.target.value)} />
                                                                                </label>

                                                                                <label>
                                                                                                종료일
                                                                                                <input required type="date" min={taskStart} value={taskEnd} onChange={e => setTaskEnd(e.target.value)} />
                                                                                </label>

                                                                                <input placeholder="상세 업무 내용" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} />

                                                                                <button type="submit">
                                                                                                업무 등록
                                                                                </button>

                                                                </form>
                                                                {/* 담당 업무 상세 */}
                                                                <div className="panel">

                                                                                <h3>직원별 담당 업무 상세</h3>

                                                                                {tasks.length === 0 && <p className="muted">
                                                                                                                등록된 담당 업무가 없습니다.
                                                                                                </p>}

                                                                                {tasks.map(task => {
                    const employee = employees.find(e => e.id === task.employeeId);
                    const dueSoon = task.status !== "완료" && isDueSoon(task.endDate);
                    return <div className="employee-row" key={task.id}>

                                                                                                                                <div className="hr-task-info">

                                                                                                                                                <strong>{task.title}</strong>

                                                                                                                                                <p className="muted">
                                                                                                                                                                {employee ? employee.name : "알 수 없음"}
                                                                                                                                                                {" · "}
                                                                                                                                                                {task.startDate}
                                                                                                                                                                {" ~ "}
                                                                                                                                                                {task.endDate}
                                                                                                                                                </p>

                                                                                                                                                <p>{task.description}</p>

                                                                                                                                                {dueSoon && <span className="hr-due">
                                                                                                                                                                                마감 임박
                                                                                                                                                                </span>}

                                                                                                                                </div>

                                                                                                                                <select value={task.status} onChange={e => changeTaskStatus(task.id, e.target.value)}>
                                                                                                                                                <option>예정</option>
                                                                                                                                                <option>진행 중</option>
                                                                                                                                                <option>완료</option>
                                                                                                                                </select>

                                                                                                                </div>;
                })}

                                                                </div>
                                                </div>}

                                                {/* 휴가 관리: 휴가 신청 및 승인/반려 */}
                                                {activeTab === "leaves" && <div className="hr-tab-content">
                                                                {/* 휴가 신청 */}
                                                                <form className="panel form-row" onSubmit={requestLeave}>

                                                                                <h3 className="full">
                                                                                                휴가 신청 등록
                                                                                </h3>

                                                                                <select required value={leaveEmployee} onChange={e => setLeaveEmployee(e.target.value)}>

                                                                                                <option value="">직원 선택</option>

                                                                                                {employees.map(employee => <option key={employee.id} value={employee.id} disabled={employee.status === "퇴사"}>
                                                                                                                                {employee.name}
                                                                                                                </option>)}

                                                                                </select>

                                                                                <label>
                                                                                                휴가 시작일
                                                                                                <input required type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} />
                                                                                </label>

                                                                                <label>
                                                                                                휴가 종료일
                                                                                                <input required type="date" min={leaveStart} value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} />
                                                                                </label>

                                                                                <button type="submit">
                                                                                                신청 등록
                                                                                </button>

                                                                </form>
                                                                {/* 휴가 승인 목록 */}
                                                                <div className="panel">

                                                                                <h3>휴가 승인 목록</h3>

                                                                                {leaves.length === 0 && <p className="muted">
                                                                                                                신청된 휴가가 없습니다.
                                                                                                </p>}

                                                                                {leaves.map(leave => {
                    const employee = employees.find(e => e.id === leave.employeeId);
                    return <div className="employee-row" key={leave.id}>

                                                                                                                                <div className="hr-leave-info">

                                                                                                                                                <strong>
                                                                                                                                                                {employee ? employee.name : "알 수 없음"}
                                                                                                                                                </strong>

                                                                                                                                                <p className="muted">
                                                                                                                                                                {leave.startDate || leave.date}
                                                                                                                                                                {" ~ "}
                                                                                                                                                                {leave.endDate || leave.date}
                                                                                                                                                </p>

                                                                                                                                                <span className={"hr-leave-status " + (leave.status === "승인" ? "approved" : leave.status === "반려" ? "rejected" : "pending")}>
                                                                                                                                                                {leave.status}
                                                                                                                                                </span>

                                                                                                                                </div>

                                                                                                                                {leave.status === "대기" && <div className="form-row hr-actions">

                                                                                                                                                                <button type="button" onClick={() => approveLeave(leave.id, "승인")}>
                                                                                                                                                                                승인
                                                                                                                                                                </button>

                                                                                                                                                                <button type="button" className="secondary" onClick={() => approveLeave(leave.id, "반려")}>
                                                                                                                                                                                반려
                                                                                                                                                                </button>

                                                                                                                                                </div>}

                                                                                                                </div>;
                })}

                                                                </div>
                                                </div>}

                                                {/* 통계 분석: 기존 직원별 업무량 화면을 독립 탭으로 이동 */}
                                                {activeTab === "analytics" && <div className="hr-tab-content">
                                                                <div className="hr-overview-grid">
                                                                                <div className="hr-overview-card"><span>전체 직원</span><strong>{employees.length}명</strong></div>
                                                                                <div className="hr-overview-card"><span>재직 직원</span><strong>{employees.filter(employee => employee.status !== "퇴사").length}명</strong></div>
                                                                                <div className="hr-overview-card"><span>미완료 담당 업무</span><strong>{tasks.filter(task => task.status !== "완료").length}건</strong></div>
                                                                                <div className="hr-overview-card"><span>휴가 승인 대기</span><strong>{leaves.filter(leave => leave.status === "대기").length}건</strong></div>
                                                                </div>
                                                                {/* 직원별 업무량 */}
                                                                <div className="panel">

                                                                                <h3>직원별 업무량</h3>

                                                                                <p className="muted">
                                                                                                담당 업무와 미완료 이슈를 구분해 표시합니다.
                                                                                                실제 성과 평가 점수는 아닙니다.
                                                                                </p>

                                                                                {employees.length === 0 && <p className="muted">
                                                                                                                등록된 직원이 없습니다.
                                                                                                </p>}

                                                                                {employees.map(employee => {
                    // 미완료 이슈 계산
                    const employeeIssues = issues.filter(issue => issue.assigneeId === employee.id && issue.status !== "완료");

                    // 미완료 담당 업무 계산
                    const employeeTasks = tasks.filter(task => task.employeeId === employee.id && task.status !== "완료");

                    // 마감 임박 업무 계산
                    const dueSoonTasks = employeeTasks.filter(task => isDueSoon(task.endDate));
                    return <div className="employee-row" key={employee.id}>

                                                                                                                                <div className="hr-employee-info">

                                                                                                                                                <strong>
                                                                                                                                                                {employee.name}
                                                                                                                                                </strong>

                                                                                                                                                <p className="muted">
                                                                                                                                                                {employee.team}
                                                                                                                                                                {" / "}
                                                                                                                                                                {employee.position}
                                                                                                                                                                {" / "}
                                                                                                                                                                {employee.rank || "직급 미지정"}
                                                                                                                                                </p>

                                                                                                                                                <span className="hr-status">
                                                                                                                                                                {employee.status || "재직"}
                                                                                                                                                </span>

                                                                                                                                </div>

                                                                                                                                <div className="hr-workload">

                                                                                                                                                <div className="hr-count">
                                                                                                                                                                <strong>
                                                                                                                                                                                {employeeIssues.length}
                                                                                                                                                                </strong>
                                                                                                                                                                <span>미완료 이슈</span>
                                                                                                                                                </div>

                                                                                                                                                <div className="hr-count">
                                                                                                                                                                <strong>
                                                                                                                                                                                {employeeTasks.length}
                                                                                                                                                                </strong>
                                                                                                                                                                <span>담당 업무</span>
                                                                                                                                                </div>

                                                                                                                                                <div className="hr-count hr-warning">
                                                                                                                                                                <strong>
                                                                                                                                                                                {dueSoonTasks.length}
                                                                                                                                                                </strong>
                                                                                                                                                                <span>7일 이내 마감</span>
                                                                                                                                                </div>

                                                                                                                                </div>

                                                                                                                </div>;
                })}

                                                                </div>
                                                                <div className="panel">
                                                                                <h3>직원별 업무 현황 비교</h3>
                                                                                <p className="muted">진행 중인 업무와 미완료 이슈를 합산한 참고용 건수입니다. 성과 평가 점수가 아닙니다.</p>
                                                                                {employees.filter(employee => employee.status !== "퇴사").map(employee => {
                    const activeTaskCount = tasks.filter(task => sameId(task.employeeId, employee.id) && task.status !== "완료").length;
                    const activeIssueCount = issues.filter(issue => sameId(issue.assigneeId || issue.assignee_id, employee.id) && issue.status !== "완료").length;
                    const total = activeTaskCount + activeIssueCount;
                    const maxTotal = Math.max(1, ...employees.map(item => tasks.filter(task => sameId(task.employeeId, item.id) && task.status !== "완료").length + issues.filter(issue => sameId(issue.assigneeId || issue.assignee_id, item.id) && issue.status !== "완료").length));
                    return <div className="hr-compare-row" key={employee.id}>
                                                                                                                <span>{employee.name}</span>
                                                                                                                <div className="hr-compare-track"><div className="hr-compare-fill" style={{
                                width: total / maxTotal * 100 + "%"
                            }} /></div>
                                                                                                                <strong>{total}건</strong>
                                                                                                </div>;
                })}
                                                                                {employees.filter(employee => employee.status !== "퇴사").length === 0 && <p className="muted">재직 중인 직원이 없습니다.</p>}
                                                                </div>
                                                </div>}

                                </section>;
}
