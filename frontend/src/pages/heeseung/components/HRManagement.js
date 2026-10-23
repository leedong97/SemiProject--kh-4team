import React, { useState } from "react";

export default function HRManagement({ data, changeData }) {
    const [name, setName] = useState("");
    const [team, setTeam] = useState("개발팀");
    const [position, setPosition] = useState("");
    const [rank, setRank] = useState("사원");
    const [leaveEmployee, setLeaveEmployee] = useState("");
    const [leaveStart, setLeaveStart] = useState("");
    const [leaveEnd, setLeaveEnd] = useState("");
    const [taskEmployee, setTaskEmployee] = useState("");
    const [taskTitle, setTaskTitle] = useState("");
    const [taskStart, setTaskStart] = useState("");
    const [taskEnd, setTaskEnd] = useState("");
    const [taskDescription, setTaskDescription] = useState("");

    // 두 날짜 구간이 서로 겹치는지 확인합니다.
    function overlaps(aStart, aEnd, bStart, bEnd) {
        return aStart <= bEnd && bStart <= aEnd;
    }

    // 이슈와 별도로 직원에게 담당 업무를 등록합니다.
    function addTask(event) {
        event.preventDefault();
        if (!taskEmployee || !taskTitle.trim() || !taskStart || !taskEnd || taskStart > taskEnd) {
            window.alert("담당 업무와 날짜를 올바르게 입력하세요.");
            return;
        }
        const employeeId = Number(taskEmployee);
        const conflict = data.leaves.some(x => x.employeeId === employeeId && x.status !== "반려" && overlaps(taskStart, taskEnd, x.startDate || x.date, x.endDate || x.date));
        if (conflict && !window.confirm("해당 직원의 휴가 일정과 겹칩니다. 업무를 등록할까요?")) return;
        changeData("담당 업무 등록", old => ({
            ...old,
            tasks: [{ id: Date.now(), employeeId, title: taskTitle.trim(), startDate: taskStart, endDate: taskEnd, description: taskDescription, status: "예정" }, ...(old.tasks || [])]
        }));
        setTaskTitle("");
        setTaskDescription("");
    }

    function addEmployee(event) {

        event.preventDefault();

        const employee = {
            id: Date.now(),
            name: name.trim(),
            team,
            position: position.trim(),
            role: position.trim(),
            rank,
            status: "재직"
        };


        if (!employee.name) {
            return;
        }

        // 기존 직원 목록에 새로운 직원 추가
        changeData(
            "직원 등록: " + employee.name,

            old => ({
                ...old,

                employees: [
                    ...old.employees,
                    employee
                ]
            })
        );

        setName("");
        setPosition("");
    }



    function requestLeave(event) {


        event.preventDefault();


        if (!leaveEmployee || !leaveStart || !leaveEnd || leaveStart > leaveEnd) {
            window.alert("휴가 시작일과 종료일을 확인하세요.");
            return;
        }

        // 휴가 기간에 예정된 담당 업무가 있는지 확인합니다.
        const conflictingTasks = (data.tasks || []).filter(x =>
            x.employeeId === Number(leaveEmployee) && x.status !== "완료" &&
            overlaps(leaveStart, leaveEnd, x.startDate, x.endDate)
        );
        if (conflictingTasks.length > 0) {
            const names = conflictingTasks.map(x => x.title).join(", ");
            if (!window.confirm("휴가 기간에 담당 업무가 있습니다: " + names + "\n그래도 신청할까요?")) return;
        }

        // 새로운 휴가 신청 데이터 생성
        const leave = {
            id: Date.now(),
            employeeId: Number(leaveEmployee),
            startDate: leaveStart,
            endDate: leaveEnd,
            status: "대기"
        };
        changeData(
            "휴가 신청 등록",

            old => ({
                ...old,

                leaves: [
                    leave,
                    ...old.leaves
                ]
            })
        );

        setLeaveStart("");
        setLeaveEnd("");
    }


    function approveLeave(id, status) {
        changeData("휴가 " + status, old => ({ ...old, leaves: old.leaves.map(x => x.id === id ? { ...x, status } : x) }));
    }


    return (
        <section>

            {/* ========================== */}
            {/* 인사 관리 페이지 제목 */}
            {/* ========================== */}

            <div className="section-head">
                <h2>인사 관리</h2>

                <p>
                    직원 등록 · 업무량 · 휴가 승인
                </p>
            </div>

            {/* ========================== */}
            {/* 1. 새로운 직원 등록 */}
            {/* ========================== */}

            <form
                className="panel form-row"
                onSubmit={addEmployee}
            >

                {/* 직원 이름 입력 */}
                <input
                    placeholder="직원 이름"
                    value={name}
                    onChange={e =>
                        setName(e.target.value)
                    }
                    required
                />

                {/* 직원 직무 입력 */}
                <input
                    placeholder="직무"
                    value={position}
                    onChange={e =>
                        setPosition(e.target.value)
                    }
                />

                {/* 직무와 직급은 별도로 관리합니다. */}
                <select value={rank} onChange={e => setRank(e.target.value)}>
                    { ["사원", "대리", "과장", "차장", "팀장", "부장", "이사", "대표"].map(x => <option key={x}>{x}</option>) }
                </select>

                {/* 직원 소속 팀 선택 */}
                <select
                    value={team}
                    onChange={e =>
                        setTeam(e.target.value)
                    }
                >
                    <option>개발팀</option>
                    <option>기획팀</option>
                    <option>디자인팀</option>
                    <option>운영팀</option>
                </select>

                {/* 직원 등록 버튼 */}
                <button>
                    직원 등록
                </button>

            </form>

            {/* ========================== */}
            {/* 2. 직원별 업무량 확인 */}
            {/* ========================== */}

            <div className="panel">

                <h3>직원별 업무량</h3>

                <p className="muted">
                    담당 업무와 미완료 이슈를 구분해 표시합니다. 이는
                    실제 성과 평가 점수는 아닙니다.
                </p>

                {/* 직원 목록 반복 */}
                {data.employees.map(e => {

                    // 해당 직원이 담당하는 미완료 이슈 개수 계산
                    const count = data.issues.filter(
                        x =>
                            x.assigneeId === e.id &&
                            x.status !== "완료"
                    ).length;

                    return (
                        <div
                            className="employee-row"
                            key={e.id}
                        >

                            {/* 직원 이름 / 팀 / 직무 */}
                            <div>
                                <strong>
                                    {e.name}
                                </strong>

                                <span className="muted">
                                    {" · "}
                                    {e.team} / {e.position} / {e.rank || "직급 미지정"}
                                </span>
                            </div>

                            {/* 담당 이슈 개수 */}
                            <span>
                                이슈 {count}건 / 담당 업무 {(data.tasks || []).filter(t => t.employeeId === e.id && t.status !== "완료").length}건
                            </span>

                        </div>
                    );
                })}

            </div>

            {/* 프로젝트 이슈와 별도로 직원의 담당 업무를 관리합니다. */}
            <form className="panel form-row" onSubmit={addTask}>
                <h3 className="full">직원 담당 업무 등록 (프로젝트 이슈와 별도)</h3>
                <select required value={taskEmployee} onChange={e => setTaskEmployee(e.target.value)}>
                    <option value="">직원 선택</option>
                    {data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                <input required placeholder="담당 업무명" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                <label>시작일 <input required type="date" value={taskStart} onChange={e => setTaskStart(e.target.value)} /></label>
                <label>종료일 <input required type="date" value={taskEnd} onChange={e => setTaskEnd(e.target.value)} /></label>
                <input placeholder="상세 업무 내용" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} />
                <button>업무 등록</button>
            </form>
            <div className="panel">
                <h3>직원별 담당 업무 상세</h3>
                {(data.tasks || []).length === 0 && <p className="muted">등록된 담당 업무가 없습니다.</p>}
                {(data.tasks || []).map(task => (
                    <div className="employee-row" key={task.id}>
                        <div>
                            <strong>{task.title}</strong>
                            <p className="muted">{data.employees.find(e => e.id === task.employeeId)?.name || "알 수 없음"} · {task.startDate} ~ {task.endDate}</p>
                            <p>{task.description}</p>
                        </div>
                        <select value={task.status} onChange={e => changeData("담당 업무 상태 변경", old => ({ ...old, tasks: (old.tasks || []).map(x => x.id === task.id ? { ...x, status: e.target.value } : x) }))}>
                            <option>예정</option><option>진행 중</option><option>완료</option>
                        </select>
                    </div>
                ))}
            </div>

            {/* ========================== */}
            {/* 3. 휴가 신청 등록 */}
            {/* ========================== */}

            <form
                className="panel form-row"
                onSubmit={requestLeave}
            >

                <h3 className="full">
                    휴가 신청 등록
                </h3>

                {/* 휴가 신청 직원 선택 */}
                <select
                    required
                    value={leaveEmployee}
                    onChange={e =>
                        setLeaveEmployee(e.target.value)
                    }
                >
                    <option value="">
                        직원 선택
                    </option>

                    {data.employees.map(e => (
                        <option
                            key={e.id}
                            value={e.id}
                        >
                            {e.name}
                        </option>
                    ))}
                </select>

                {/* 휴가 시작일과 종료일을 각각 입력합니다. */}
                <label>휴가 시작일
                    <input required type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} />
                </label>
                <label>휴가 종료일
                    <input required type="date" min={leaveStart} value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} />
                </label>

                {/* 휴가 신청 버튼 */}
                <button>
                    신청 등록
                </button>

            </form>

            {/* ========================== */}
            {/* 4. 휴가 승인 목록 */}
            {/* ========================== */}

            <div className="panel">

                <h3>휴가 승인 목록</h3>

                {/* 휴가 신청 내역이 없을 때 */}
                {data.leaves.length === 0 && (
                    <p className="muted">
                        신청된 휴가가 없습니다.
                    </p>
                )}

                {/* 휴가 신청 목록 반복 */}
                {data.leaves.map(leave => (

                    <div
                        className="employee-row"
                        key={leave.id}
                    >

                        {/* 직원 이름 / 휴가 날짜 / 승인 상태 */}
                        <span>
                            {data.employees.find(
                                e => e.id === leave.employeeId
                            )?.name || "알 수 없음"}

                            {" · "}
                            {leave.startDate || leave.date} ~ {leave.endDate || leave.date}

                            {" · "}
                            {leave.status}
                        </span>

                        {/* 승인 대기 중인 휴가만 버튼 표시 */}
                        {leave.status === "대기" && (

                            <div className="form-row">

                                {/* 휴가 승인 */}
                                <button
                                    onClick={() =>
                                        approveLeave(
                                            leave.id,
                                            "승인"
                                        )
                                    }
                                >
                                    승인
                                </button>

                                {/* 휴가 반려 */}
                                <button
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

                ))}

            </div>

        </section>
    );

}
