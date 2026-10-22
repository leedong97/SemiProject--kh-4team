import React, { useState } from "react";

export default function EmployeeEvaluation({ data, changeData }) {
    const [employeeId, setEmployeeId] = useState("");
    const [period, setPeriod] = useState("2026년 4분기");
    const [score, setScore] = useState("3");
    const [feedback, setFeedback] = useState("");
    const [appeals, setAppeals] = useState({});

    function addEvaluation(event) {
        event.preventDefault();
        if (!employeeId) return;
        const evaluation = { id: Date.now(), employeeId: Number(employeeId), period, score: Number(score), feedback, status: "초안", appeal: "" };
        changeData("직원 평가 초안 작성", old => ({ ...old, evaluations: [evaluation, ...old.evaluations] }));
        setFeedback("");
    }

    function updateEvaluation(id, patch, action) {
        changeData(action, old => ({ ...old, evaluations: old.evaluations.map(x => x.id === id ? { ...x, ...patch } : x) }));
    }

    return <section><div className="section-head"><h2>직원 평가</h2><p>초안 → 승인 요청 → 승인/반려 · 이의신청</p></div>
        <p className="warning">학습용 관리자 화면입니다. 실제 평가 정보의 접근 제한은 서버에서 구현해야 합니다.</p>
        <form className="panel form-row" onSubmit={addEvaluation}>
            <select required value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">평가 대상 선택</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            <input aria-label="평가 기간" value={period} onChange={e => setPeriod(e.target.value)} required />
            <label>종합 점수(1~5)<select value={score} onChange={e => setScore(e.target.value)}>{[1,2,3,4,5].map(x => <option key={x}>{x}</option>)}</select></label>
            <textarea placeholder="평가 근거와 피드백" value={feedback} onChange={e => setFeedback(e.target.value)} />
            <button>평가 초안 저장</button>
        </form>
        {data.evaluations.map(x => <article className="panel" key={x.id}>
            <div className="between"><h3>{data.employees.find(e => e.id === x.employeeId)?.name || "알 수 없음"} · {x.period}</h3><span className="pill">{x.status}</span></div>
            <p>종합 점수: {x.score}/5</p><p>{x.feedback || "피드백 없음"}</p>
            <div className="form-row">
                {x.status === "초안" && <button onClick={() => updateEvaluation(x.id,{status:"승인 요청"},"평가 승인 요청")}>승인 요청</button>}
                {x.status === "승인 요청" && <><button onClick={() => updateEvaluation(x.id,{status:"승인"},"평가 승인")}>승인</button><button className="secondary" onClick={() => updateEvaluation(x.id,{status:"반려"},"평가 반려")}>반려</button></>}
            </div>
            {x.status === "승인" && <div className="form-row"><input placeholder="이의신청 사유 (관리자 대리 입력)" value={appeals[x.id] || ""} onChange={e => setAppeals(old => ({ ...old, [x.id]: e.target.value }))}/><button className="secondary" onClick={() => { const appeal = (appeals[x.id] || "").trim(); if (appeal) updateEvaluation(x.id,{appeal},"평가 이의신청 기록"); }}>이의신청 기록</button></div>}
            {x.appeal && <p className="history">이의신청: {x.appeal}</p>}
        </article>)}
    </section>;
}
