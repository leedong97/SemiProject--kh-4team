import React, { useState, useEffect, useCallback } from "react";
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

    // 실제 DB 연동: 토큰은 로그인 후 nexus_auth_token에 저장합니다.
    const [dbEmployees, setDbEmployees] = useState([]);
    const [dbLeaves, setDbLeaves] = useState([]);
    const [dbRetired, setDbRetired] = useState([]);
    const [dbWork, setDbWork] = useState({ projects: [], issues: [], members: [] });
    // 업무 관리 화면에서만 사용하는 검색·선택 상태입니다.
    const [workSearch, setWorkSearch] = useState("");
    const [workDepartment, setWorkDepartment] = useState("전체");
    const [workStatus, setWorkStatus] = useState("전체");
    const [workSelectedId, setWorkSelectedId] = useState(null);
    const [workPage, setWorkPage] = useState(1);
    const [dbLoading, setDbLoading] = useState(true);
    const [dbError, setDbError] = useState("");
    const [dbReady, setDbReady] = useState(false);
    const [busy, setBusy] = useState(false);

    // 휴가 배지를 클릭했을 때 기간을 보여줄 직원 번호
    const [openedLeaveEmployeeId, setOpenedLeaveEmployeeId] = useState(null);

    const apiBase = (process.env.REACT_APP_API_URL || "http://localhost:3333") + "/api/hr";

    const apiRequest = useCallback(async (path, options = {}) => {
        const token = localStorage.getItem("nexus_auth_token");
        if (!token) throw new Error("로그인 토큰이 없습니다. 다시 로그인하세요.");
        const response = await fetch(apiBase + path, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
                ...(options.headers || {})
            }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "서버 요청에 실패했습니다.");
        return result;
    }, [apiBase]);

    const loadHrData = useCallback(async () => {
        try {
            setDbLoading(true);
            const [employeeRows, leaveRows, retiredRows, workRows] = await Promise.all([
                apiRequest("/employees"),
                apiRequest("/leaves"),
                apiRequest("/retired"),
                apiRequest("/work-overview")
            ]);
            setDbWork(workRows);
            setDbEmployees(employeeRows.map(employee => ({
                id: employee.employee_id,
                name: employee.employee_name,
                team: employee.employee_department,
                department: employee.employee_department,
                position: employee.employee_position,
                rank: employee.employee_grade,
                salary: employee.employee_salary,
                status: employee.display_status,
                hireDate: employee.employee_hire_date,
                retirementDate: employee.employee_retired_at
            })));
            setDbRetired(retiredRows.map(employee => ({
                id: employee.employee_id,
                name: employee.employee_name,
                team: employee.employee_department,
                rank: employee.employee_grade,
                status: "퇴사",
                hireDate: employee.employee_hire_date,
                retirementDate: employee.employee_retired_at
            })));
            setDbLeaves(leaveRows.map(leave => ({
                id: leave.leave_id,
                employeeId: leave.employee_id,
                startDate: String(leave.start_date).slice(0, 10),
                endDate: String(leave.end_date).slice(0, 10),
                type: leave.leave_type,
                status: leave.status
            })));
            setDbReady(true);
            setDbError("");
        } catch (error) {
            setDbError(error.message);
            setDbReady(false);
        } finally {
            setDbLoading(false);
        }
    }, [apiRequest]);

    useEffect(() => {
        loadHrData();

        // 휴가가 끝나면 DB가 재직 상태를 반환하므로 주기적으로 다시 조회합니다.
        // 화면을 켜둔 상태에서도 1분 이내에 변경된 상태를 확인할 수 있습니다.
        const timer = setInterval(() => {
            loadHrData();
        }, 60000);

        // 다른 탭에서 돌아왔을 때도 최신 상태를 조회합니다.
        function refreshOnFocus() {
            loadHrData();
        }
        window.addEventListener("focus", refreshOnFocus);

        return () => {
            clearInterval(timer);
            window.removeEventListener("focus", refreshOnFocus);
        };
    }, [loadHrData]);

    // MySQL DATE는 시간 정보가 없습니다. 날짜 부분만 정확하게 표시합니다.
    // 서버에서 YYYY-MM-DD 문자열을 보내므로 시간대 차이로 날짜가 바뀌지 않습니다.
    function formatEmployeeDate(value) {
        if (!value) return "-";
        if (typeof value === "string") return value.slice(0, 10);
        return "-";
    }

    // 직원의 현재 상태에 따라 서로 다른 색상의 배지를 사용합니다.
    function employeeStatusClass(status) {
        if (status === "휴가") return "hr-status-vacation";
        if (status === "휴직") return "hr-status-leave";
        if (status === "퇴사") return "hr-status-retired";
        return "hr-status-working";
    }

    // 상위 컴포넌트에서 받은 데이터
    const employees = dbReady ? [...dbEmployees, ...dbRetired] : [];
    // 프로젝트와 이슈는 MySQL에서 조회한 최신 자료만 사용합니다.
    const issues = dbWork.issues;
    const leaves = dbReady ? dbLeaves : [];

    // 추가 기능: 직원 검색, 정렬, 수정, 퇴사, 프로젝트 조회
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("전체");
    const [employeeSort, setEmployeeSort] = useState("name");
    const [showRetired, setShowRetired] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editTeam, setEditTeam] = useState("");
    const [editRank, setEditRank] = useState("");
    const [editSalary, setEditSalary] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [detailTab, setDetailTab] = useState("summary");
    const evaluations = data?.evaluations || [];
    const projects = dbWork.projects;
    const projectMembers = dbWork.members;
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
        return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
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
    async function saveEmployeeEdit(event) {
        event.preventDefault();
        if (!editingEmployee || !editTeam.trim() || !editRank.trim()) return;
        const salary = Number(editSalary);
        if (!Number.isInteger(salary) || salary < 0) {
            window.alert("연봉을 0 이상의 정수로 입력하세요.");
            return;
        }
        if (!dbReady) {
            window.alert("DB 연결 후 수정할 수 있습니다. 연결 오류를 확인하세요.");
            return;
        }
        try {
            setBusy(true);
            await apiRequest("/employees/" + editingEmployee.id, {
                method: "PATCH",
                body: JSON.stringify({
                    employee_department: editTeam.trim(),
                    employee_grade: editRank.trim(),
                    employee_salary: salary
                })
            });
            await loadHrData();
            setEditingEmployee(null);
            window.alert("직원 정보가 DB에 저장되었습니다.");
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusy(false);
        }
    }

    // 퇴사자는 삭제하지 않고 상태와 퇴사일을 남깁니다.
    async function retireEmployee(employee) {
        if (employee.status === "퇴사") return;
        if (!dbReady) return window.alert("DB 연결 상태를 확인하세요.");
        if (!window.confirm(employee.name + " 직원을 퇴사 처리하시겠습니까?")) return;
        try {
            setBusy(true);
            await apiRequest("/employees/" + employee.id + "/retire", { method: "PATCH" });
            await loadHrData();
            window.alert("퇴사자 정보로 이동했습니다.");
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusy(false);
        }
    }

    // 완료/해결/종료 상태는 미완료 업무량에서 제외합니다.
    function isIssueComplete(issue) {
        return ["완료", "해결", "종료", "closed", "resolved"].includes(String(issue.status || "").toLowerCase());
    }

    // DB의 업무 진행 상태는 변경하지 않고 마감일만 비교합니다.
    // 완료되지 않은 이슈가 마감일을 지난 경우에만 일정 상태를 기한 초과로 표시합니다.
    function isIssueOverdue(issue) {
        if (isIssueComplete(issue) || !issue.due) return false;
        const dueDate = String(issue.due).slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return false;
        return dueDate < getToday();
    }

    // 기한 초과일 수는 화면 표시용으로만 계산합니다.
    function getOverdueDays(issue) {
        if (!isIssueOverdue(issue)) return 0;
        const today = new Date(getToday() + "T00:00:00");
        const dueDate = new Date(String(issue.due).slice(0, 10) + "T00:00:00");
        return Math.round((today - dueDate) / 86400000);
    }

    // 프로젝트의 담당자 또는 프로젝트 구성원 목록에서 참여 정보를 찾습니다.
    function getEmployeeProjects(employee) {
        return projects.filter(project => sameId(project.managerId || project.manager_id, employee.id) || projectMembers.some(member => sameId(member.projectId || member.project_id, project.id || project.project_id) && sameId(member.employeeId || member.employee_id, employee.id)));
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
        const dateText = String(endDate).slice(0, 10);
        return /^\d{4}-\d{2}-\d{2}$/.test(dateText) && dateText >= getToday() && dateText <= getSevenDaysLater();
    }

    // 직원 등록
    async function addEmployee(event) {
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
        const employeeCode = window.prompt("신규 사원코드 (예: EMP-051)");
        if (!employeeCode) return;
        const employeeEmail = window.prompt("신규 직원 이메일");
        if (!employeeEmail) return;
        const initialPassword = window.prompt("초기 비밀번호 (8자 이상)");
        if (!initialPassword) return;
        try {
            await apiRequest("/employees", {
                method: "POST",
                body: JSON.stringify({
                    employee_code: employeeCode.trim(), employee_name: name.trim(),
                    employee_email: employeeEmail.trim(), employee_pw: initialPassword,
                    employee_department: team, employee_grade: rank, employee_position: position.trim()
                })
            });
            await loadHrData();
            setName("");
            setPosition("");
            window.alert("직원이 MySQL에 등록되었습니다.");
        } catch (error) {
            window.alert("직원 등록 실패: " + error.message);
        }
    }

    // 휴가 승인 및 반려
    async function approveLeave(id, status) {
        if (!dbReady) return window.alert("DB 연결 상태를 확인하세요.");
        if (!window.confirm("휴가를 " + status + " 처리하시겠습니까?")) return;
        try {
            setBusy(true);
            await apiRequest("/leaves/" + id, {
                method: "PATCH",
                body: JSON.stringify({ status: status })
            });
            await loadHrData();
            window.alert("휴가 " + status + " 처리가 완료되었습니다.");
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusy(false);
        }
    }

    // 승인/반려된 기록은 DB에 보관하고, 승인 대기 목록에서만 숨깁니다.
    const pendingLeaves = leaves.filter(leave => leave.status === "대기");

    // 화면 출력
    return <section className="hr-management">
        <div className="hr-db-notice" role="status">
            {dbLoading ? "직원 및 휴가 정보를 불러오는 중입니다." :
                dbError ? "DB 연결 오류: " + dbError : "MySQL 직원·휴가 정보 연결됨"}
            <button type="button" onClick={loadHrData} disabled={dbLoading || busy}>
                <span className="hr-refresh-label">↻ 새로고침</span>
            </button>
        </div>

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
                        <td>{formatEmployeeDate(employee.hireDate)}</td>
                        <td>
                            {employee.status === "휴가" ? (
                                <div className="hr-vacation-cell">
                                    <button
                                        type="button"
                                        className="hr-employee-status hr-status-vacation hr-vacation-button"
                                        onClick={() => setOpenedLeaveEmployeeId(openedLeaveEmployeeId === employee.id ? null : employee.id)}
                                        aria-expanded={openedLeaveEmployeeId === employee.id}
                                        title="클릭하면 휴가 기간을 볼 수 있습니다."
                                    >
                                        휴가 <span aria-hidden="true">{openedLeaveEmployeeId === employee.id ? "▲" : "▼"}</span>
                                    </button>
                                    {openedLeaveEmployeeId === employee.id && (
                                        <div className="hr-vacation-dates">
                                            {leaves.filter(leave => leave.employeeId === employee.id && leave.status === "승인" &&
                                                leave.startDate <= new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) &&
                                                leave.endDate >= new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }))
                                                .map(leave => <div key={leave.id}>{leave.startDate} ~ {leave.endDate} ({leave.type})</div>)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className={"hr-employee-status " + employeeStatusClass(employee.status)}>{employee.status || "재직"}</span>
                            )}
                            {employee.status === "퇴사" && employee.retirementDate ? <small> {formatEmployeeDate(employee.retirementDate)}</small> : null}
                        </td>
                        <td><div className="hr-inline-actions">
                            <button type="button" className="hr-action-detail" onClick={() => {
                                setSelectedEmployeeId(String(employee.id));
                                setDetailTab("summary");
                            }}>상세</button>
                            {employee.status !== "퇴사" && <><button type="button" className="hr-action-edit" onClick={() => startEmployeeEdit(employee)}>수정</button><button type="button" className="hr-danger-button" onClick={() => retireEmployee(employee)}>퇴사</button></>}
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
                    const overdueTasks = employeeIssues.filter(issue => !isIssueComplete(issue) && issue.due && String(issue.due).slice(0, 10) < getToday());
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
                                    <strong>{employeeIssues.filter(issue => !isIssueComplete(issue)).length}건 진행 중</strong>
                                    <p>담당 이슈 {employeeIssues.length}건 · 평가 이력 {employeeEvaluations.length}건</p>
                                </div>
                            </div>
                        </div>}

                        {detailTab === "personnel" && <div className="hr-detail-content hr-detail-fields" role="tabpanel">
                            {[["이름", employee.name], ["부서", employee.team || employee.department], ["직급", employee.rank || employee.position], ["입사일", formatEmployeeDate(employee.hireDate || employee.hire_date)], ["재직 상태", employee.status || "재직"], ["퇴사일", employee.retirementDate]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "미등록"}</strong></div>)}
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

        {/* 프로젝트/이슈를 중복 등록하지 않고 MySQL 조회 결과만 표시합니다. */}
        {activeTab === "tasks" && <div className="hr-tab-content">
            <div className="panel hr-work-overview">
                <div className="hr-enhanced-heading">
                    <div>
                        <h3>직원별 업무 현황</h3>
                        <p className="muted">직원을 선택하면 참여 프로젝트와 담당 이슈를 확인할 수 있습니다. 프로젝트·이슈 관리 데이터가 자동 반영됩니다.</p>
                    </div>
                    <button type="button" onClick={loadHrData} disabled={dbLoading}>새로고침</button>
                </div>
                {dbError && <p role="alert" className="hr-detail-empty">업무 조회 오류: {dbError}</p>}
                {(() => {
                    // 실제 DB에서 조회한 직원·이슈만 집계합니다.
                    const activeEmployees = employees.filter(employee => employee.status !== "퇴사");
                    const assigned = issues.filter(issue => activeEmployees.some(employee => sameId(issue.assigneeId, employee.id)));
                    const openIssues = assigned.filter(issue => !isIssueComplete(issue));
                    const unlinked = issues.filter(issue => !issue.projectName);
                    const teams = [...new Set(activeEmployees.map(employee => employee.team || "부서 미지정"))].sort();
                    const visible = activeEmployees.filter(employee => {
                        const nameMatches = (employee.name + " " + (employee.team || "")).toLowerCase().includes(workSearch.trim().toLowerCase());
                        const teamMatches = workDepartment === "전체" || (employee.team || "부서 미지정") === workDepartment;
                        const mine = issues.filter(issue => sameId(issue.assigneeId, employee.id));
                        const statusMatches = workStatus === "전체" || (workStatus === "진행 중" && mine.some(issue => !isIssueComplete(issue))) || (workStatus === "완료" && mine.some(isIssueComplete)) || (workStatus === "업무 없음" && mine.length === 0);
                        return nameMatches && teamMatches && statusMatches;
                    }).sort((a, b) => String(a.name).localeCompare(String(b.name), "ko"));
                    const pageCount = Math.max(1, Math.ceil(visible.length / 10));
                    const page = Math.min(workPage, pageCount);
                    const shown = visible.slice((page - 1) * 10, page * 10);
                    // 선택한 직원이 현재 검색 결과에 없으면 첫 번째 직원을 자동으로 보여줍니다.
                    const selected = shown.find(employee => sameId(employee.id, workSelectedId)) || shown[0] || null;
                    const selectedProjects = selected ? getEmployeeProjects(selected) : [];
                    const selectedIssues = selected ? issues.filter(issue => sameId(issue.assigneeId, selected.id)) : [];
                    return <>
                        <div className="hr-work-summary">
                            <div><span>재직 직원</span><strong>{activeEmployees.length}명</strong></div>
                            <div><span>담당자 지정 이슈</span><strong>{assigned.length}건</strong></div>
                            <div><span>미완료 이슈</span><strong>{openIssues.length}건</strong><small className="hr-work-overdue-count">기한 초과 {openIssues.filter(isIssueOverdue).length}건</small></div>
                            <div><span>프로젝트 미지정 이슈</span><strong>{unlinked.length}건</strong></div>
                        </div>
                        <p className="hr-work-hint">담당자 지정 이슈는 재직 직원에게 배정된 건수입니다. 프로젝트 미지정은 전체 이슈 중 프로젝트 연결이 없는 건수입니다.</p>
                        <div className="hr-work-filters">
                            <label>직원 검색<input value={workSearch} onChange={event => { setWorkSearch(event.target.value); setWorkPage(1); }} placeholder="이름 또는 부서 검색" /></label>
                            <label>부서<select value={workDepartment} onChange={event => { setWorkDepartment(event.target.value); setWorkPage(1); }}><option value="전체">전체 부서</option>{teams.map(teamName => <option key={teamName}>{teamName}</option>)}</select></label>
                            <label>업무 상태<select value={workStatus} onChange={event => { setWorkStatus(event.target.value); setWorkPage(1); }}><option>전체</option><option>진행 중</option><option>완료</option><option>업무 없음</option></select></label>
                        </div>
                        <div className="hr-work-layout">
                            <div className="hr-work-list">
                                <div className="hr-work-list-title">직원 목록 <span>{visible.length}명 검색됨</span></div>
                                {shown.length === 0 && <p className="hr-work-empty">조건에 맞는 직원이 없습니다.</p>}
                                {shown.map(employee => {
                                    const mine = issues.filter(issue => sameId(issue.assigneeId, employee.id));
                                    const open = mine.filter(issue => !isIssueComplete(issue));
                                    const isSelected = selected && sameId(selected.id, employee.id);
                                    return <button key={employee.id} type="button" className={isSelected ? "hr-work-person selected" : "hr-work-person"} onClick={() => setWorkSelectedId(employee.id)} aria-pressed={Boolean(isSelected)}>
                                        <span><strong>{employee.name}</strong><small>{employee.team || "부서 미지정"} · {employee.rank || "직급 미지정"}</small></span>
                                        <span className="hr-work-person-count">진행 {open.length} · 전체 {mine.length}</span>
                                    </button>;
                                })}
                                {pageCount > 1 && <div className="hr-work-pages"><button type="button" disabled={page === 1} onClick={() => setWorkPage(page - 1)}>이전</button><span>{page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setWorkPage(page + 1)}>다음</button></div>}
                            </div>
                            <div className="hr-work-detail">
                                {!selected ? <div className="hr-work-placeholder"><strong>직원을 선택해 주세요</strong><p>왼쪽 목록에서 직원을 선택하면 참여 프로젝트와 담당 이슈를 확인할 수 있습니다.</p></div> : <>
                                    <div className="hr-work-detail-heading"><div><h4>{selected.name} <small>{selected.team || "부서 미지정"}</small></h4><p>참여 프로젝트 {selectedProjects.length}개 · 진행 중 {selectedIssues.filter(issue => !isIssueComplete(issue)).length}건 · 전체 이슈 {selectedIssues.length}건</p></div></div>
                                    <h5>참여 프로젝트</h5>
                                    {selectedProjects.length === 0 ? <p className="hr-work-empty">참여 프로젝트가 없습니다.</p> : <div className="hr-work-projects">{selectedProjects.map(project => <span key={project.id || project.project_id}>{project.name || project.project_title}</span>)}</div>}
                                    <h5>담당 이슈 <small>{selectedIssues.length}건</small></h5>
                                    {selectedIssues.length === 0 ? <p className="hr-work-empty">배정된 이슈가 없습니다.</p> : <div className="hr-work-detail-issues">{selectedIssues.map(issue => <div className="hr-work-detail-issue" key={issue.id}>
                                        <div className="hr-work-issue-main"><strong>{issue.title}</strong><div className="hr-work-issue-badges"><span className={isIssueComplete(issue) ? "hr-work-state done" : "hr-work-state"}>{issue.status || "상태 미등록"}</span>{isIssueOverdue(issue) && <span className="hr-work-overdue" title="마감일이 지났지만 완료되지 않은 업무입니다.">기한 초과 · {getOverdueDays(issue)}일</span>}</div></div>
                                        <div className="hr-work-issue-meta"><span className={!issue.projectName ? "hr-work-unlinked" : "hr-work-linked"}>{issue.projectName || "공통 업무 · 프로젝트 미배정"}</span><span>마감 {issue.due ? String(issue.due).slice(0, 10) : "미설정"}</span></div>
                                    </div>)}</div>}
                                </>}
                            </div>
                        </div>
                    </>;
                })()}
            </div>
        </div>}

        {/* 휴가 관리: 승인/반려 */}
        {activeTab === "leaves" && <div className="hr-tab-content">
            {/* 휴가 승인 목록 */}
            <div className="panel">

                <h3>휴가 승인 목록</h3>

                {pendingLeaves.length === 0 && <p className="muted">
                    승인 대기 중인 휴가가 없습니다.
                </p>}

                {pendingLeaves.map(leave => {
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
        {activeTab === "analytics" && <div className="hr-tab-content hr-analytics">
            <div className="hr-analytics-heading">
                <div>
                    <span className="hr-analytics-eyebrow">HR INSIGHTS</span>
                    <h2>인사 통계 대시보드</h2>
                    <p>직원 현황과 업무 분포를 한눈에 확인하세요.</p>
                </div>
                <span className="hr-analytics-chip">실시간 데이터 기준</span>
            </div>
            <div className="hr-overview-grid">
                <div className="hr-overview-card hr-overview-total"><span>전체 직원</span><strong>{employees.length}명</strong></div>
                <div className="hr-overview-card hr-overview-active"><span>재직 직원</span><strong>{employees.filter(employee => employee.status !== "퇴사").length}명</strong></div>
                <div className="hr-overview-card hr-overview-tasks"><span>미완료 담당 이슈</span><strong>{issues.filter(issue => !isIssueComplete(issue)).length}건</strong></div>
                <div className="hr-overview-card hr-overview-leaves"><span>휴가 승인 대기</span><strong>{leaves.filter(leave => leave.status === "대기").length}건</strong></div>
            </div>
            {/* 직원별 업무 수치와 비교 그래프를 한 줄에 통합합니다. */}
            <div className="panel hr-analytics-panel hr-unified-panel">
                <div className="hr-unified-heading">
                    <div>
                        <h3>직원별 업무 현황</h3>
                        <p className="muted">미완료 이슈를 직원별로 비교합니다. 업무량은 성과 평가 점수가 아닙니다.</p>
                    </div>
                    <span className="hr-unified-count">재직 직원 {employees.filter(employee => employee.status !== "퇴사").length}명</span>
                </div>
                {(() => {
                    // 퇴사자를 제외한 직원만 분석합니다.
                    const activeEmployees = employees.filter(employee => employee.status !== "퇴사");

                    // 모든 직원에게 동일한 기준을 적용하여 건수를 계산합니다.
                    const workloadRows = activeEmployees.map(employee => {
                        const employeeIssues = issues.filter(issue =>
                            sameId(issue.assigneeId ?? issue.assignee_id, employee.id) && !isIssueComplete(issue)
                        );
                        const dueSoonIssues = employeeIssues.filter(issue => isDueSoon(issue.due));

                        return {
                            employee: employee,
                            issueCount: employeeIssues.length,
                            projectCount: getEmployeeProjects(employee).length,
                            dueSoonCount: dueSoonIssues.length,
                            total: employeeIssues.length
                        };
                    });

                    // 그래프는 재직 직원 중 가장 큰 업무량을 100%로 표시합니다.
                    const maxTotal = Math.max(1, ...workloadRows.map(row => row.total));

                    if (workloadRows.length === 0) {
                        return <p className="muted hr-unified-empty">재직 중인 직원이 없습니다.</p>;
                    }

                    return <div className="hr-unified-table-wrap">
                        <table className="hr-unified-table">
                            <thead>
                                <tr>
                                    <th>직원 정보</th>
                                    <th>미완료 이슈</th>
                                    <th>참여 프로젝트</th>
                                    <th>7일 이내 이슈 마감</th>
                                    <th>업무량 비교</th>
                                </tr>
                            </thead>
                            <tbody>
                                {workloadRows.map(row => <tr key={row.employee.id}>
                                    <td>
                                        <strong className="hr-unified-name">{row.employee.name}</strong>
                                        <span className="hr-unified-meta">
                                            {row.employee.team || "부서 미지정"} / {row.employee.position || "직책 미지정"} / {row.employee.rank || "직급 미지정"}
                                        </span>
                                    </td>
                                    <td><strong className="hr-unified-number">{row.issueCount}</strong>건</td>
                                    <td><strong className="hr-unified-number">{row.projectCount}</strong>개</td>
                                    <td><strong className={row.dueSoonCount > 0 ? "hr-unified-number hr-unified-warning" : "hr-unified-number"}>{row.dueSoonCount}</strong>건</td>
                                    <td>
                                        <div className="hr-unified-graph">
                                            <div className="hr-compare-track">
                                                <div className="hr-compare-fill" style={{ width: (row.total / maxTotal * 100) + "%" }} />
                                            </div>
                                            <strong>{row.total}건</strong>
                                        </div>
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>;
                })()}
            </div>
        </div>}

    </section>;
}