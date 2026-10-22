import React, { useState } from "react";

export default function IssueManagement({ data, changeData }) {
    const [title, setTitle] = useState("");
    const [assigneeId, setAssigneeId] = useState("");
    const [due, setDue] = useState("");
    const [priority, setPriority] = useState("보통");
    const [search, setSearch] = useState("");
    const [comments, setComments] = useState({});

    function addIssue(event) {
        event.preventDefault();
        if (!title.trim()) return;
        const issue = { id: Date.now(), title: title.trim(), assigneeId: Number(assigneeId) || null,
            due, priority, status: "접수", comments: [], history: [] };
        changeData("이슈 등록: " + issue.title, old => ({ ...old, issues: [issue, ...old.issues] }));
        setTitle(""); setDue("");
    }

    function updateIssue(id, patch, description) {
        changeData(description, old => ({ ...old, issues: old.issues.map(issue => {
            if (issue.id !== id) return issue;
            const history = [...issue.history, { at: new Date().toLocaleString("ko-KR"), text: description }];
            return { ...issue, ...patch, history };
        }) }));
    }

    function changeAssignee(issue, newId) {
        const name = id => data.employees.find(e => e.id === id)?.name || "미지정";
        updateIssue(issue.id, { assigneeId: Number(newId) || null },
            `${issue.title}: 담당자 ${name(issue.assigneeId)} → ${name(Number(newId))}`);
    }

    function addComment(issue) {
        const message = (comments[issue.id] || "").trim();
        if (!message) return;
        updateIssue(issue.id, { comments: [...issue.comments, message] }, `${issue.title}: 댓글 추가`);
        setComments(old => ({ ...old, [issue.id]: "" }));
    }

    const filtered = data.issues.filter(issue => issue.title.toLowerCase().includes(search.toLowerCase()));
    return <section><div className="section-head"><h2>이슈 관리</h2><p>등록 · 담당자 변경 · 댓글 · 검증 · 재오픈</p></div>
        <form className="panel form-row" onSubmit={addIssue}>
            <input placeholder="새 이슈 제목" value={title} onChange={e => setTitle(e.target.value)} required />
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}><option value="">담당자 미지정</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
            <select value={priority} onChange={e => setPriority(e.target.value)}><option>낮음</option><option>보통</option><option>높음</option><option>긴급</option></select>
            <input aria-label="마감일" type="date" value={due} onChange={e => setDue(e.target.value)} />
            <button>이슈 등록</button>
        </form>
        <input className="search" placeholder="이슈 제목 검색" value={search} onChange={e => setSearch(e.target.value)} />
        {filtered.map(issue => <article className="panel" key={issue.id}>
            <div className="between"><h3>#{issue.id} · {issue.title}</h3><span className="pill">{issue.priority}</span></div>
            <div className="form-row">
                <label>담당자<select value={issue.assigneeId || ""} onChange={e => changeAssignee(issue, e.target.value)}><option value="">미지정</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
                <label>상태<select value={issue.status} onChange={e => updateIssue(issue.id, { status: e.target.value }, `${issue.title}: 상태 ${issue.status} → ${e.target.value}`)}>{["접수", "진행 중", "검토 중", "완료", "재오픈"].map(x => <option key={x}>{x}</option>)}</select></label>
                <label>마감일<input type="date" value={issue.due || ""} onChange={e => updateIssue(issue.id, { due: e.target.value }, `${issue.title}: 마감일 변경`)} /></label>
            </div>
            {issue.due && issue.status !== "완료" && issue.due < new Date().toLocaleDateString("en-CA") && <p className="error">마감일이 지났습니다.</p>}
            <div className="form-row"><button type="button" className="secondary" onClick={() => updateIssue(issue.id, { status: "완료" }, `${issue.title}: 검증 완료`)}>검증 완료</button><button type="button" className="secondary" onClick={() => updateIssue(issue.id, { status: "재오픈" }, `${issue.title}: 이슈 재오픈`)}>재오픈</button></div>
            <div className="form-row"><input placeholder="댓글 작성" value={comments[issue.id] || ""} onChange={e => setComments(old => ({ ...old, [issue.id]: e.target.value }))}/><button type="button" className="secondary" onClick={() => addComment(issue)}>댓글 추가</button></div>
            <details><summary>댓글 {issue.comments.length}개 · 변경 이력 {issue.history.length}개</summary>
                <h4>댓글</h4>{issue.comments.map((x,i) => <p key={i} className="history">{x}</p>)}
                <h4>변경 이력</h4>{issue.history.map((x,i) => <p key={i} className="history">{x.at} — {x.text}</p>)}
            </details>
        </article>)}
    </section>;
}
