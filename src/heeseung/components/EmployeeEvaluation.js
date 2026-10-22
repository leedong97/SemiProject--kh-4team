import React, { useState } from "react";
import { canLeadProject } from "../../common/utils/permissions";

export default function EmployeeEvaluation({ data, changeData }) {
    const [employeeId, setEmployeeId] = useState("");
    const [evaluatorId, setEvaluatorId] = useState("");
    const [responses, setResponses] = useState({});
    const [period, setPeriod] = useState("2026년 4분기");
    const [score, setScore] = useState("3");
    const [feedback, setFeedback] = useState("");
    const [appeals, setAppeals] = useState({});


    function addEvaluation(event) {

        // 폼 제출 시 페이지 새로고침 방지
        event.preventDefault();

        // 평가 대상 직원이 선택되지 않았다면 종료
        if (!employeeId || !data.employees.some(e => e.id === Number(evaluatorId) && canLeadProject(e))) {
            window.alert("평가 대상과 팀장 이상 평가자를 선택하세요.");
            return;
        }

        // 새로운 직원 평가 데이터 생성
        const evaluation = {
            id: Date.now(),
            employeeId: Number(employeeId),
            evaluatorId: Number(evaluatorId),
            employeeResponse: "",
            period,
            score: Number(score),
            feedback,
            status: "초안",
            appeal: ""
        };

        // 기존 평가 목록에 새로운 평가 추가
        changeData(
            "직원 평가 초안 작성",

            old => ({
                ...old,

                evaluations: [
                    evaluation,
                    ...old.evaluations
                ]
            })
        );

        // 평가 등록 후 피드백 입력창 초기화
        setFeedback("");
    }

    function updateEvaluation(id, patch, action) {
        changeData(action, old => ({ ...old, evaluations: old.evaluations.map(x => x.id === id ? { ...x, ...patch } : x) }));
    }

    return (
        <section>

            {/* ========================== */}
            {/* 직원 평가 페이지 제목 */}
            {/* ========================== */}

            <div className="section-head">
                <h2>직원 평가</h2>

                <p>
                    팀장 이상 평가자 지정 · 피드백 회신 · 이의신청
                </p>
            </div>

            {/* 보안 안내 메시지 */}
            <p className="warning">
                학습용 관리자 화면입니다.
                실제 평가 정보의 접근 제한은 서버에서 구현해야 합니다.
            </p>

            {/* ========================== */}
            {/* 새로운 직원 평가 등록 */}
            {/* ========================== */}

            <form
                className="panel form-row"
                onSubmit={addEvaluation}
            >

                {/* 평가 대상 직원 선택 */}
                <select
                    required
                    value={employeeId}
                    onChange={e =>
                        setEmployeeId(e.target.value)
                    }
                >
                    <option value="">
                        평가 대상 선택
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

                {/* 팀장 이상 직급만 평가자로 지정할 수 있습니다. */}
                <select required value={evaluatorId} onChange={e => setEvaluatorId(e.target.value)}>
                    <option value="">평가자 선택 (팀장 이상)</option>
                    {data.employees.filter(canLeadProject).map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.rank})</option>
                    ))}
                </select>

                {/* 평가 기간 입력 */}
                <input
                    aria-label="평가 기간"
                    value={period}
                    onChange={e =>
                        setPeriod(e.target.value)
                    }
                    required
                />

                {/* 평가 점수 선택 */}
                <label>
                    종합 점수(1~5)

                    <select
                        value={score}
                        onChange={e =>
                            setScore(e.target.value)
                        }
                    >
                        {[1, 2, 3, 4, 5].map(x => (
                            <option key={x}>
                                {x}
                            </option>
                        ))}
                    </select>
                </label>

                {/* 평가 피드백 입력 */}
                <textarea
                    placeholder="평가 근거와 피드백"
                    value={feedback}
                    onChange={e =>
                        setFeedback(e.target.value)
                    }
                />

                {/* 평가 등록 버튼 */}
                <button>
                    평가 초안 저장
                </button>

            </form>

            {/* ========================== */}
            {/* 등록된 직원 평가 목록 */}
            {/* ========================== */}

            {data.evaluations.map(x => (

                <article
                    className="panel"
                    key={x.id}
                >

                    {/* 직원 이름 / 평가 기간 / 상태 */}
                    <div className="between">

                        <h3>
                            {data.employees.find(
                                e => e.id === x.employeeId
                            )?.name || "알 수 없음"}
                            {" · "}
                            {x.period}
                        </h3>

                        <span className="pill">
                            {x.status}
                        </span>

                    </div>

                    <p className="muted">평가자: {data.employees.find(e => e.id === x.evaluatorId)?.name || "미지정"}</p>
                    {/* 평가 점수 */}
                    <p>
                        종합 점수: {x.score}/5
                    </p>

                    {/* 평가 피드백 */}
                    <p>
                        {x.feedback || "피드백 없음"}
                    </p>

                    {/* ========================== */}
                    {/* 평가 승인 및 반려 */}
                    {/* ========================== */}

                    <div className="form-row">

                        {/* 초안 상태일 때 승인 요청 */}
                        {x.status === "초안" && (

                            <button
                                onClick={() =>
                                    updateEvaluation(
                                        x.id,
                                        {
                                            status: "승인 요청"
                                        },
                                        "평가 승인 요청"
                                    )
                                }
                            >
                                승인 요청
                            </button>

                        )}

                        {/* 승인 요청 상태일 때 */}
                        {x.status === "승인 요청" && (
                            <>

                                {/* 평가 승인 */}
                                <button
                                    onClick={() =>
                                        updateEvaluation(
                                            x.id,
                                            {
                                                status: "승인"
                                            },
                                            "평가 승인"
                                        )
                                    }
                                >
                                    승인
                                </button>

                                {/* 평가 반려 */}
                                <button
                                    className="secondary"
                                    onClick={() =>
                                        updateEvaluation(
                                            x.id,
                                            {
                                                status: "반려"
                                            },
                                            "평가 반려"
                                        )
                                    }
                                >
                                    반려
                                </button>

                            </>
                        )}

                    </div>

                    {/* 평가 대상자의 피드백 회신을 기록합니다. */}
                    {x.status === "승인" && (
                        <div className="form-row">
                            <input
                                placeholder="직원 피드백 회신 (관리자 대리 입력)"
                                value={responses[x.id] || ""}
                                onChange={e => setResponses(old => ({ ...old, [x.id]: e.target.value }))}
                            />
                            <button type="button" className="secondary" onClick={() => {
                                const response = (responses[x.id] || "").trim();
                                if (response) updateEvaluation(x.id, { employeeResponse: response }, "직원 평가 피드백 회신");
                            }}>피드백 저장</button>
                        </div>
                    )}
                    {x.employeeResponse && <p className="history">직원 회신: {x.employeeResponse}</p>}

                    {/* ========================== */}
                    {/* 평가 이의신청 */}
                    {/* ========================== */}

                    {/* 승인된 평가만 이의신청 가능 */}
                    {x.status === "승인" && (

                        <div className="form-row">

                            {/* 이의신청 사유 입력 */}
                            <input
                                placeholder="이의신청 사유 (관리자 대리 입력)"
                                value={appeals[x.id] || ""}
                                onChange={e =>
                                    setAppeals(old => ({
                                        ...old,
                                        [x.id]: e.target.value
                                    }))
                                }
                            />

                            {/* 이의신청 기록 버튼 */}
                            <button
                                className="secondary"
                                onClick={() => {

                                    const appeal = (
                                        appeals[x.id] || ""
                                    ).trim();

                                    if (appeal) {
                                        updateEvaluation(
                                            x.id,
                                            {
                                                appeal
                                            },
                                            "평가 이의신청 기록"
                                        );
                                    }

                                }}
                            >
                                이의신청 기록
                            </button>

                        </div>

                    )}

                    {/* ========================== */}
                    {/* 등록된 이의신청 내용 표시 */}
                    {/* ========================== */}

                    {x.appeal && (

                        <p className="history">
                            이의신청: {x.appeal}
                        </p>

                    )}

                </article>

            ))}

        </section>
    );

}
