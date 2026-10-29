
import React, { useState } from "react";
import "./HRManagement.css";

// 인사 관리 컴포넌트
export default function HRManagement({ data, changeData }) {

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
    const employees = data.employees || [];
    const issues = data.issues || [];
    const tasks = data.tasks || [];
    const leaves = data.leaves || [];

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

        return (
            endDate >= getToday() &&
            endDate <= getSevenDaysLater()
        );
    }

    // 직원 등록
    function addEmployee(event) {

        event.preventDefault();

        if (!name.trim()) {
            window.alert("직원 이름을 입력하세요.");
            return;
        }

        // 같은 팀의 동명이인 확인
        const duplicateEmployee = employees.some(
            employee =>
                employee.name === name.trim() &&
                employee.team === team &&
                employee.status !== "퇴사"
        );

        if (duplicateEmployee) {

            const confirmed = window.confirm(
                "같은 팀에 동일한 이름의 직원이 있습니다.\n" +
                "그래도 등록하시겠습니까?"
            );

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
            employees: [
                ...(old.employees || []),
                employee
            ]
        }));

        setName("");
        setPosition("");

        window.alert("직원이 등록되었습니다.");
    }

    // 담당 업무 등록
    function addTask(event) {

        event.preventDefault();

        if (
            !taskEmployee ||
            !taskTitle.trim() ||
            !taskStart ||
            !taskEnd ||
            taskStart > taskEnd
        ) {
            window.alert("담당 업무와 날짜를 확인하세요.");
            return;
        }

        const employeeId = Number(taskEmployee);

        const employee = employees.find(
            x => x.id === employeeId
        );

        if (!employee || employee.status === "퇴사") {
            window.alert("업무를 배정할 수 없는 직원입니다.");
            return;
        }

        // 해당 직원의 휴가와 업무 날짜 비교
        const conflictingLeaves = leaves.filter(
            leave =>
                leave.employeeId === employeeId &&
                leave.status !== "반려" &&
                overlaps(
                    taskStart,
                    taskEnd,
                    leave.startDate || leave.date,
                    leave.endDate || leave.date
                )
        );

        if (conflictingLeaves.length > 0) {

            const details = conflictingLeaves.map(
                leave =>
                    (leave.startDate || leave.date) +
                    " ~ " +
                    (leave.endDate || leave.date) +
                    " (" + leave.status + ")"
            ).join("\n");

            const confirmed = window.confirm(
                "휴가 일정과 겹칩니다.\n\n" +
                details +
                "\n\n그래도 업무를 등록할까요?"
            );

            if (!confirmed) {
                return;
            }
        }

        changeData("담당 업무 등록", old => ({
            ...old,
            tasks: [
                {
                    id: Date.now(),
                    employeeId: employeeId,
                    title: taskTitle.trim(),
                    startDate: taskStart,
                    endDate: taskEnd,
                    description: taskDescription,
                    status: "예정"
                },
                ...(old.tasks || [])
            ]
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
            tasks: (old.tasks || []).map(
                task =>
                    task.id === id
                        ? { ...task, status: status }
                        : task
            )
        }));
    }

    // 휴가 신청
    function requestLeave(event) {

        event.preventDefault();

        if (
            !leaveEmployee ||
            !leaveStart ||
            !leaveEnd ||
            leaveStart > leaveEnd
        ) {
            window.alert("휴가 기간을 확인하세요.");
            return;
        }

        const employeeId = Number(leaveEmployee);

        const employee = employees.find(
            x => x.id === employeeId
        );

        if (!employee || employee.status === "퇴사") {
            window.alert("휴가를 신청할 수 없는 직원입니다.");
            return;
        }

        // 기존 휴가와 기간이 겹치는지 확인
        const duplicateLeave = leaves.some(
            leave =>
                leave.employeeId === employeeId &&
                leave.status !== "반려" &&
                overlaps(
                    leaveStart,
                    leaveEnd,
                    leave.startDate || leave.date,
                    leave.endDate || leave.date
                )
        );

        if (duplicateLeave) {
            window.alert("이미 신청한 휴가 기간과 겹칩니다.");
            return;
        }

        // 휴가 기간과 담당 업무 비교
        const conflictingTasks = tasks.filter(
            task =>
                task.employeeId === employeeId &&
                task.status !== "완료" &&
                overlaps(
                    leaveStart,
                    leaveEnd,
                    task.startDate,
                    task.endDate
                )
        );

        if (conflictingTasks.length > 0) {

            const details = conflictingTasks.map(
                task =>
                    task.title +
                    " (" +
                    task.startDate +
                    " ~ " +
                    task.endDate +
                    ")"
            ).join("\n");

            const confirmed = window.confirm(
                "휴가 기간에 담당 업무가 있습니다.\n\n" +
                details +
                "\n\n그래도 신청하시겠습니까?"
            );

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
            leaves: [
                leave,
                ...(old.leaves || [])
            ]
        }));

        setLeaveStart("");
        setLeaveEnd("");

        window.alert("휴가 신청이 등록되었습니다.");
    }

    // 휴가 승인 또는 반려
    function approveLeave(id, status) {

        const leave = leaves.find(
            x => x.id === id
        );

        if (!leave || leave.status !== "대기") {
            window.alert("처리할 수 없는 휴가입니다.");
            return;
        }

        const confirmed = window.confirm(
            "휴가를 " + status + " 처리하시겠습니까?"
        );

        if (!confirmed) {
            return;
        }

        changeData("휴가 " + status, old => ({
            ...old,
            leaves: (old.leaves || []).map(
                x =>
                    x.id === id && x.status === "대기"
                        ? { ...x, status: status }
                        : x
            )
        }));
    }

    // 화면 출력
    return (

        <section className="hr-management">

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

            {/* 직원 등록 */}
            <form
                className="panel form-row"
                onSubmit={addEmployee}
            >

                <h3 className="full">
                    신규 직원 등록
                </h3>

                <input
                    placeholder="직원 이름"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />

                <input
                    placeholder="직무"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                />

                <select
                    value={rank}
                    onChange={e => setRank(e.target.value)}
                >

                    {[
                        "사원",
                        "대리",
                        "과장",
                        "차장",
                        "팀장",
                        "부장",
                        "이사",
                        "대표"
                    ].map(x => (
                        <option key={x}>{x}</option>
                    ))}

                </select>

                <select
                    value={team}
                    onChange={e => setTeam(e.target.value)}
                >
                    <option>개발팀</option>
                    <option>기획팀</option>
                    <option>디자인팀</option>
                    <option>운영팀</option>
                </select>

                <button type="submit">
                    직원 등록
                </button>

            </form>

            {/* 직원별 업무량 */}
            <div className="panel">

                <h3>직원별 업무량</h3>

                <p className="muted">
                    담당 업무와 미완료 이슈를 구분해 표시합니다.
                    실제 성과 평가 점수는 아닙니다.
                </p>

                {employees.length === 0 && (
                    <p className="muted">
                        등록된 직원이 없습니다.
                    </p>
                )}

                {employees.map(employee => {

                    // 미완료 이슈 계산
                    const employeeIssues = issues.filter(
                        issue =>
                            issue.assigneeId === employee.id &&
                            issue.status !== "완료"
                    );

                    // 미완료 담당 업무 계산
                    const employeeTasks = tasks.filter(
                        task =>
                            task.employeeId === employee.id &&
                            task.status !== "완료"
                    );

                    // 마감 임박 업무 계산
                    const dueSoonTasks = employeeTasks.filter(
                        task => isDueSoon(task.endDate)
                    );

                    return (

                        <div
                            className="employee-row"
                            key={employee.id}
                        >

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

                        </div>

                    );
                })}

            </div>

            {/* 담당 업무 등록 */}
            <form
                className="panel form-row"
                onSubmit={addTask}
            >

                <h3 className="full">
                    직원 담당 업무 등록 (프로젝트 이슈와 별도)
                </h3>

                <select
                    required
                    value={taskEmployee}
                    onChange={e => setTaskEmployee(e.target.value)}
                >

                    <option value="">직원 선택</option>

                    {employees.map(employee => (
                        <option
                            key={employee.id}
                            value={employee.id}
                            disabled={employee.status === "퇴사"}
                        >
                            {employee.name}
                        </option>
                    ))}

                </select>

                <input
                    required
                    placeholder="담당 업무명"
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                />

                <label>
                    시작일
                    <input
                        required
                        type="date"
                        value={taskStart}
                        onChange={e => setTaskStart(e.target.value)}
                    />
                </label>

                <label>
                    종료일
                    <input
                        required
                        type="date"
                        min={taskStart}
                        value={taskEnd}
                        onChange={e => setTaskEnd(e.target.value)}
                    />
                </label>

                <input
                    placeholder="상세 업무 내용"
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                />

                <button type="submit">
                    업무 등록
                </button>

            </form>

            {/* 담당 업무 상세 */}
            <div className="panel">

                <h3>직원별 담당 업무 상세</h3>

                {tasks.length === 0 && (
                    <p className="muted">
                        등록된 담당 업무가 없습니다.
                    </p>
                )}

                {tasks.map(task => {

                    const employee = employees.find(
                        e => e.id === task.employeeId
                    );

                    const dueSoon = (
                        task.status !== "완료" &&
                        isDueSoon(task.endDate)
                    );

                    return (

                        <div
                            className="employee-row"
                            key={task.id}
                        >

                            <div className="hr-task-info">

                                <strong>{task.title}</strong>

                                <p className="muted">
                                    {employee
                                        ? employee.name
                                        : "알 수 없음"}
                                    {" · "}
                                    {task.startDate}
                                    {" ~ "}
                                    {task.endDate}
                                </p>

                                <p>{task.description}</p>

                                {dueSoon && (
                                    <span className="hr-due">
                                        마감 임박
                                    </span>
                                )}

                            </div>

                            <select
                                value={task.status}
                                onChange={e =>
                                    changeTaskStatus(
                                        task.id,
                                        e.target.value
                                    )
                                }
                            >
                                <option>예정</option>
                                <option>진행 중</option>
                                <option>완료</option>
                            </select>

                        </div>

                    );
                })}

            </div>

            {/* 휴가 신청 */}
            <form
                className="panel form-row"
                onSubmit={requestLeave}
            >

                <h3 className="full">
                    휴가 신청 등록
                </h3>

                <select
                    required
                    value={leaveEmployee}
                    onChange={e => setLeaveEmployee(e.target.value)}
                >

                    <option value="">직원 선택</option>

                    {employees.map(employee => (
                        <option
                            key={employee.id}
                            value={employee.id}
                            disabled={employee.status === "퇴사"}
                        >
                            {employee.name}
                        </option>
                    ))}

                </select>

                <label>
                    휴가 시작일
                    <input
                        required
                        type="date"
                        value={leaveStart}
                        onChange={e => setLeaveStart(e.target.value)}
                    />
                </label>

                <label>
                    휴가 종료일
                    <input
                        required
                        type="date"
                        min={leaveStart}
                        value={leaveEnd}
                        onChange={e => setLeaveEnd(e.target.value)}
                    />
                </label>

                <button type="submit">
                    신청 등록
                </button>

            </form>

            {/* 휴가 승인 목록 */}
            <div className="panel">

                <h3>휴가 승인 목록</h3>

                {leaves.length === 0 && (
                    <p className="muted">
                        신청된 휴가가 없습니다.
                    </p>
                )}

                {leaves.map(leave => {

                    const employee = employees.find(
                        e => e.id === leave.employeeId
                    );

                    return (

                        <div
                            className="employee-row"
                            key={leave.id}
                        >

                            <div className="hr-leave-info">

                                <strong>
                                    {employee
                                        ? employee.name
                                        : "알 수 없음"}
                                </strong>

                                <p className="muted">
                                    {leave.startDate || leave.date}
                                    {" ~ "}
                                    {leave.endDate || leave.date}
                                </p>

                                <span
                                    className={
                                        "hr-leave-status " +
                                        (leave.status === "승인"
                                            ? "approved"
                                            : leave.status === "반려"
                                                ? "rejected"
                                                : "pending")
                                    }
                                >
                                    {leave.status}
                                </span>

                            </div>

                            {leave.status === "대기" && (

                                <div className="form-row hr-actions">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            approveLeave(
                                                leave.id,
                                                "승인"
                                            )
                                        }
                                    >
                                        승인
                                    </button>

                                    <button
                                        type="button"
                                        className="secondary"
                                        onClick={() =>
                                            approveLeave(
                                                leave.id,
                                                "반려"
                                            )
                                        }
                                    >
                                        반려
                                    </button>

                                </div>

                            )}

                        </div>

                    );
                })}

            </div>

        </section>
    );
}
