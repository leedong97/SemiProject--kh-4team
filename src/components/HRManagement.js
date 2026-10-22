import React, { useState } from "react";

export default function HRManagement({ data, changeData }) {
    const [name, setName] = useState("");
    const [team, setTeam] = useState("개발팀");
    const [position, setPosition] = useState("");
    const [leaveEmployee, setLeaveEmployee] = useState("");
    const [leaveDate, setLeaveDate] = useState("");

    function addEmployee(event) {
        event.preventDefault();
        const employee = { id: Date.now(), name: name.trim(), team, position: position.trim(), role: position.trim(), status: "재직" };
        if (!employee.name) return;
        changeData("직원 등록: " + employee.name, old => ({ ...old, employees: [...old.employees, employee] }));
        setName(""); setPosition("");
    }

    function requestLeave(event) {
        event.preventDefault();
        if (!leaveEmployee || !leaveDate) return;
        const leave = { id: Date.now(), employeeId: Number(leaveEmployee), date: leaveDate, status: "대기" };
        changeData("휴가 신청 등록", old => ({ ...old, leaves: [leave, ...old.leaves] }));
        setLeaveDate("");
    }

    function approveLeave(id, status) {
        changeData("휴가 " + status, old => ({ ...old, leaves: old.leaves.map(x => x.id === id ? { ...x, status } : x) }));
    }

    return <section><div className="section-head"><h2>인사 관리</h2><p>직원 등록 · 업무량 · 휴가 승인</p></div>
        <form className="panel form-row" onSubmit={addEmployee}>
            <input placeholder="직원 이름" value={name} onChange={e => setName(e.target.value)} required />
            <input placeholder="직무" value={position} onChange={e => setPosition(e.target.value)} />
            <select value={team} onChange={e => setTeam(e.target.value)}><option>개발팀</option><option>기획팀</option><option>디자인팀</option><option>운영팀</option></select>
            <button>직원 등록</button>
        </form>
        <div className="panel"><h3>직원별 업무량</h3><p className="muted">담당 이슈 개수로 표시한 참고 지표이며 실제 성과 평가 점수는 아닙니다.</p>
            {data.employees.map(e => { const count = data.issues.filter(x => x.assigneeId === e.id && x.status !== "완료").length;
                return <div className="employee-row" key={e.id}><div><strong>{e.name}</strong><span className="muted"> · {e.team} / {e.position}</span></div><span>{count}건</span></div>;
            })}
        </div>
        <form className="panel form-row" onSubmit={requestLeave}>
            <h3 className="full">휴가 신청 등록</h3>
            <select required value={leaveEmployee} onChange={e => setLeaveEmployee(e.target.value)}><option value="">직원 선택</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            <input required aria-label="휴가일" type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
            <button>신청 등록</button>
        </form>
        <div className="panel"><h3>휴가 승인 목록</h3>{data.leaves.length === 0 && <p className="muted">신청된 휴가가 없습니다.</p>}
            {data.leaves.map(leave => <div className="employee-row" key={leave.id}><span>{data.employees.find(e => e.id === leave.employeeId)?.name || "알 수 없음"} · {leave.date} · {leave.status}</span>
                {leave.status === "대기" && <div className="form-row"><button onClick={() => approveLeave(leave.id,"승인")}>승인</button><button className="secondary" onClick={() => approveLeave(leave.id,"반려")}>반려</button></div>}</div>)}
        </div>
    </section>;
}
