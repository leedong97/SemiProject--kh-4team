
import React, { useState } from "react";
import "./EmployeeEvaluation.css";

function EmployeeEvaluation({ data, changeData, currentUser }) {

    // ==========================================
    // 1. ERP 데이터
    // ==========================================

    const employees = data?.employees || [];
    const projects = data?.projects || [];
    const issues = data?.issues || [];

    // changeData가 없을 때 브라우저에 평가 저장
    const [savedEvaluations, setSavedEvaluations] = useState(function () {

        try {
            const saved = localStorage.getItem("nexus_evaluations");
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            return [];
        }
    });

    const useParentData = typeof changeData === "function";

    const evaluations = useParentData
        ? (data?.evaluations || [])
        : savedEvaluations;

    // ==========================================
    // 2. 로그인 직원 및 평가 권한
    // ==========================================

    const [testUserId, setTestUserId] = useState("");

    const loginId = testUserId || currentUser?.id;

    const loginEmployee = employees.find(function (employee) {
        return String(employee.id) === String(loginId);
    });

    function canEvaluateEmployee(employee) {

        if (!employee) {
            return false;
        }

        const managerRanks = [
            "팀장", "실장", "부장",
            "이사", "상무", "전무",
            "대표", "대표이사"
        ];

        return (
            managerRanks.includes(employee.rank || employee.position) ||
            employee.department === "인사팀"
        );
    }

    const canEvaluate = canEvaluateEmployee(loginEmployee);

    // ==========================================
    // 3. 화면 상태
    // ==========================================

    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [chartEmployeeId, setChartEmployeeId] = useState("");

    // ==========================================
    // 4. 평가 입력값
    // ==========================================

    const [period, setPeriod] = useState("2026년 4분기");
    const [projectScore, setProjectScore] = useState("3");
    const [issueScore, setIssueScore] = useState("3");
    const [teamworkScore, setTeamworkScore] = useState("3");
    const [scheduleScore, setScheduleScore] = useState("3");
    const [feedback, setFeedback] = useState("");

    // ==========================================
    // 5. 공통 함수
    // ==========================================

    function employeeName(id) {

        const employee = employees.find(function (item) {
            return String(item.id) === String(id);
        });

        if (!employee) {
            return "알 수 없음";
        }

        return employee.name || employee.employee_name || "이름 없음";
    }

    // 네 가지 평가 점수의 평균 계산
    function calculateScore() {

        const total =
            Number(projectScore) +
            Number(issueScore) +
            Number(teamworkScore) +
            Number(scheduleScore);

        return Number((total / 4).toFixed(2));
    }

    // ==========================================
    // 6. 직원별 업무 성과
    // ==========================================

    function getProjectCount(id) {

        return projects.filter(function (project) {

            const isManager =
                String(project.managerId) === String(id);

            const members = project.memberIds || [];

            const isMember = members.some(function (memberId) {
                return String(memberId) === String(id);
            });

            return isManager || isMember;

        }).length;
    }

    function getIssueCount(id) {

        return issues.filter(function (issue) {

            return (
                String(issue.assigneeId) === String(id) &&
                issue.status === "완료" &&
                !issue.deletedAt
            );

        }).length;
    }

    // ==========================================
    // 7. 평가 조회 권한
    // ==========================================

    const visibleEvaluations = evaluations.filter(function (item) {

        if (!loginEmployee) {
            return false;
        }

        // 인사팀은 모든 평가 조회
        if (loginEmployee.department === "인사팀") {
            return true;
        }

        // 본인이 작성한 평가
        if (
            String(item.evaluatorId) ===
            String(loginEmployee.id)
        ) {
            return true;
        }

        // 평가 권한자는 다른 사람의 승인 요청 조회
        if (
            canEvaluate &&
            item.status === "승인 요청"
        ) {
            return true;
        }

        // 일반 직원은 승인된 본인 평가만 조회
        return (
            String(item.employeeId) === String(loginEmployee.id) &&
            item.status === "승인"
        );
    });

    const filteredEvaluations = visibleEvaluations.filter(function (item) {

        return employeeName(item.employeeId)
            .toLowerCase()
            .includes(search.toLowerCase());
    });

    const pendingCount = visibleEvaluations.filter(function (item) {
        return item.status === "승인 요청";
    }).length;

    const approvedCount = visibleEvaluations.filter(function (item) {
        return item.status === "승인";
    }).length;

    // ==========================================
    // 8. 직원별 그래프 데이터
    // ==========================================

    const chartEmployee = employees.find(function (employee) {
        return String(employee.id) === String(chartEmployeeId);
    });

    // 일반 직원은 본인만 선택 가능
    const displayEmployee = canEvaluate
        ? (chartEmployee || employees[0])
        : loginEmployee;

    function getEmployeeEvaluation(employeeId) {

        // 조회 권한이 있는 평가만 사용
        const employeeEvaluations = visibleEvaluations.filter(function (item) {

            return String(item.employeeId) === String(employeeId);
        });

        // 가장 최근에 등록된 평가를 먼저 정렬
        employeeEvaluations.sort(function (a, b) {
            return Number(b.id) - Number(a.id);
        });

        if (employeeEvaluations.length === 0) {
            return null;
        }

        return employeeEvaluations[0];
    }

    const chartEvaluation = displayEmployee
        ? getEmployeeEvaluation(displayEmployee.id)
        : null;

    const scoreItems = [
        {
            title: "프로젝트 기여도",
            key: "projectScore"
        },
        {
            title: "이슈 해결 품질",
            key: "issueScore"
        },
        {
            title: "협업 및 소통",
            key: "teamworkScore"
        },
        {
            title: "일정 준수",
            key: "scheduleScore"
        }
    ];

    // ==========================================
    // 9. 평가 저장
    // ==========================================

    function saveEvaluations(newEvaluations) {

        if (useParentData) {

            changeData("직원 평가 변경", function (oldData) {

                return {
                    ...oldData,
                    evaluations: newEvaluations
                };
            });

        } else {

            setSavedEvaluations(newEvaluations);

            localStorage.setItem(
                "nexus_evaluations",
                JSON.stringify(newEvaluations)
            );
        }
    }

    // ==========================================
    // 10. 입력창 초기화
    // ==========================================

    function resetForm() {

        setEditingId(null);
        setSelectedEmployeeId("");
        setPeriod("2026년 4분기");
        setProjectScore("3");
        setIssueScore("3");
        setTeamworkScore("3");
        setScheduleScore("3");
        setFeedback("");
        setShowForm(false);
    }

    function openNewForm(employeeId) {

        resetForm();

        if (employeeId) {
            setSelectedEmployeeId(String(employeeId));
        }

        setShowForm(true);
    }

    // ==========================================
    // 11. 평가 수정
    // ==========================================

    function editEvaluation(evaluation) {

        if (!canEvaluate) {
            alert("평가 수정 권한이 없습니다.");
            return;
        }

        if (
            String(evaluation.evaluatorId) !==
            String(loginEmployee?.id)
        ) {
            alert("본인이 작성한 평가만 수정할 수 있습니다.");
            return;
        }

        if (
            evaluation.status !== "초안" &&
            evaluation.status !== "반려"
        ) {
            alert("초안 또는 반려된 평가만 수정할 수 있습니다.");
            return;
        }

        setEditingId(evaluation.id);
        setSelectedEmployeeId(String(evaluation.employeeId));
        setPeriod(evaluation.period);
        setProjectScore(String(evaluation.projectScore));
        setIssueScore(String(evaluation.issueScore));
        setTeamworkScore(String(evaluation.teamworkScore));
        setScheduleScore(String(evaluation.scheduleScore));
        setFeedback(evaluation.feedback || "");
        setShowForm(true);
    }

    // ==========================================
    // 12. 평가 등록 및 수정 저장
    // ==========================================

    function addEvaluation(event) {

        event.preventDefault();

        if (!canEvaluate) {
            alert("평가 등록 권한이 없습니다.");
            return;
        }

        if (!selectedEmployeeId) {
            alert("평가 대상 직원을 선택하세요.");
            return;
        }

        if (!period.trim() || !feedback.trim()) {
            alert("평가 기간과 의견을 입력하세요.");
            return;
        }

        if (
            String(selectedEmployeeId) ===
            String(loginEmployee.id)
        ) {
            alert("본인은 평가할 수 없습니다.");
            return;
        }

        // 같은 기간의 중복 평가 확인
        const duplicate = evaluations.some(function (item) {

            return (
                String(item.employeeId) === String(selectedEmployeeId) &&
                item.period === period.trim() &&
                String(item.id) !== String(editingId)
            );
        });

        if (duplicate) {
            alert("같은 기간에 등록된 평가가 이미 있습니다.");
            return;
        }

        // 수정할 때
        if (editingId !== null) {

            const original = evaluations.find(function (item) {
                return String(item.id) === String(editingId);
            });

            if (
                !original ||
                String(original.evaluatorId) !== String(loginEmployee.id) ||
                !["초안", "반려"].includes(original.status)
            ) {
                alert("수정할 수 없는 평가입니다.");
                return;
            }

            const updatedEvaluations = evaluations.map(function (item) {

                if (String(item.id) === String(editingId)) {

                    return {
                        ...item,
                        employeeId: selectedEmployeeId,
                        period: period.trim(),
                        projectScore: Number(projectScore),
                        issueScore: Number(issueScore),
                        teamworkScore: Number(teamworkScore),
                        scheduleScore: Number(scheduleScore),
                        score: calculateScore(),
                        feedback: feedback.trim(),
                        status: "초안",
                        rejectReason: ""
                    };
                }

                return item;
            });

            saveEvaluations(updatedEvaluations);

            alert("평가가 수정되었습니다.");

        } else {

            // 신규 평가 등록
            const newEvaluation = {
                id: Date.now(),
                employeeId: selectedEmployeeId,
                evaluatorId: loginEmployee.id,
                period: period.trim(),
                projectScore: Number(projectScore),
                issueScore: Number(issueScore),
                teamworkScore: Number(teamworkScore),
                scheduleScore: Number(scheduleScore),
                score: calculateScore(),
                feedback: feedback.trim(),
                status: "초안",
                rejectReason: ""
            };

            saveEvaluations([
                newEvaluation,
                ...evaluations
            ]);

            alert("평가가 등록되었습니다.");
        }

        // 등록 또는 수정한 직원 그래프 표시
        setChartEmployeeId(String(selectedEmployeeId));

        resetForm();
    }

    // ==========================================
    // 13. 승인 요청 / 승인 / 반려
    // ==========================================

    function changeStatus(evaluation, newStatus) {

        if (!canEvaluate) {
            alert("평가 처리 권한이 없습니다.");
            return;
        }

        const isWriter =
            String(evaluation.evaluatorId) ===
            String(loginEmployee.id);

        const isTarget =
            String(evaluation.employeeId) ===
            String(loginEmployee.id);

        if (newStatus === "승인 요청") {

            if (!isWriter || evaluation.status !== "초안") {
                alert("평가 작성자만 승인 요청할 수 있습니다.");
                return;
            }

        } else {

            if (isWriter || isTarget) {
                alert("본인이 작성했거나 본인 대상인 평가는 승인할 수 없습니다.");
                return;
            }

            if (evaluation.status !== "승인 요청") {
                alert("승인 요청 상태만 처리할 수 있습니다.");
                return;
            }
        }

        let reason = "";

        if (newStatus === "반려") {

            const input = window.prompt("반려 사유를 입력하세요.");

            if (input === null) {
                return;
            }

            reason = input.trim();

            if (!reason) {
                alert("반려 사유를 입력하세요.");
                return;
            }
        }

        const newEvaluations = evaluations.map(function (item) {

            if (String(item.id) === String(evaluation.id)) {

                return {
                    ...item,
                    status: newStatus,
                    rejectReason: reason
                };
            }

            return item;
        });

        saveEvaluations(newEvaluations);

        alert("평가 상태가 변경되었습니다.");
    }

    // ==========================================
    // 14. 화면 출력
    // ==========================================

    return (
        <div className="employee-evaluation">

            {/* 상단 제목 */}
            <div className="ev-header">

                <div>
                    <span className="ev-eyebrow">
                        NEXUS ERP / PEOPLE MANAGEMENT
                    </span>

                    <h2>직원 인사평가</h2>

                    <p>
                        직원별 업무 성과와 평가 결과를 관리합니다.
                    </p>
                </div>

                {canEvaluate && (
                    <button
                        type="button"
                        onClick={function () {
                            openNewForm("");
                        }}
                    >
                        + 새 평가 등록
                    </button>
                )}
            </div>

            {/* 테스트용 직원 선택 */}
            <div className="ev-test-bar">

                <div>
                    <strong>현재 직원</strong>
                    <p>프론트엔드 권한 테스트</p>
                </div>

                <select
                    value={testUserId}
                    onChange={function (event) {
                        setTestUserId(event.target.value);
                        setChartEmployeeId("");
                        resetForm();
                    }}
                >
                    <option value="">기존 로그인 직원</option>

                    {employees.map(function (employee) {

                        return (
                            <option
                                key={employee.id}
                                value={employee.id}
                            >
                                {employeeName(employee.id)}
                                {" / "}
                                {employee.rank || employee.position || "직급 없음"}
                            </option>
                        );
                    })}
                </select>

                <span className={
                    canEvaluate
                        ? "ev-permission allowed"
                        : "ev-permission denied"
                }>
                    {canEvaluate ? "평가 권한 있음" : "평가 권한 없음"}
                </span>
            </div>

            {/* 평가 현황 */}
            <div className="ev-stats">

                <div className="ev-stat">
                    <span>조회 가능한 평가</span>
                    <strong>{visibleEvaluations.length}</strong>
                </div>

                <div className="ev-stat">
                    <span>승인 대기</span>
                    <strong>{pendingCount}</strong>
                </div>

                <div className="ev-stat">
                    <span>승인 완료</span>
                    <strong>{approvedCount}</strong>
                </div>
            </div>

            {/* 직원 목록 */}
            <div className="ev-panel">

                <div className="ev-panel-head">
                    <h3>직원별 업무 성과</h3>
                    <span>
                        {canEvaluate
                            ? employees.length
                            : loginEmployee ? 1 : 0}명
                    </span>
                </div>

                <table className="ev-table">
                    <thead>
                        <tr>
                            <th>직원</th>
                            <th>부서</th>
                            <th>직급</th>
                            <th>프로젝트</th>
                            <th>완료 이슈</th>
                            <th>관리</th>
                        </tr>
                    </thead>

                    <tbody>

                        {employees
                            .filter(function (employee) {

                                if (canEvaluate) {
                                    return true;
                                }

                                return (
                                    String(employee.id) ===
                                    String(loginEmployee?.id)
                                );
                            })
                            .map(function (employee) {

                                return (
                                    <tr key={employee.id}>

                                        <td>
                                            {employeeName(employee.id)}
                                        </td>

                                        <td>
                                            {employee.department || "-"}
                                        </td>

                                        <td>
                                            {employee.rank ||
                                                employee.position ||
                                                "-"}
                                        </td>

                                        <td>
                                            {getProjectCount(employee.id)}건
                                        </td>

                                        <td>
                                            {getIssueCount(employee.id)}건
                                        </td>

                                        <td>
                                            <div className="ev-review-actions">

                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={function () {
                                                        setChartEmployeeId(
                                                            String(employee.id)
                                                        );
                                                    }}
                                                >
                                                    성과 보기
                                                </button>

                                                {canEvaluate &&
                                                    String(employee.id) !==
                                                    String(loginEmployee?.id) && (

                                                        <button
                                                            type="button"
                                                            onClick={function () {
                                                                openNewForm(employee.id);
                                                            }}
                                                        >
                                                            평가 등록
                                                        </button>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            {/* ==========================================
                직원별 성과 그래프
            ========================================== */}

            <div className="ev-panel ev-employee-chart">

                <div className="ev-panel-head">

                    <div>
                        <h3>직원별 성과 분석</h3>
                        <p>선택한 직원의 평가 결과를 확인합니다.</p>
                    </div>

                    {canEvaluate && (
                        <select
                            className="ev-chart-select"
                            value={displayEmployee
                                ? String(displayEmployee.id)
                                : ""}
                            onChange={function (event) {
                                setChartEmployeeId(event.target.value);
                            }}
                        >
                            {employees.map(function (employee) {

                                return (
                                    <option
                                        key={employee.id}
                                        value={employee.id}
                                    >
                                        {employeeName(employee.id)}
                                    </option>
                                );
                            })}
                        </select>
                    )}
                </div>

                {displayEmployee ? (

                    <div className="ev-chart-content">

                        {/* 직원 프로필 */}
                        <div className="ev-chart-profile">

                            <div className="ev-chart-avatar">
                                {employeeName(displayEmployee.id).substring(0, 1)}
                            </div>

                            <div>
                                <h3>
                                    {employeeName(displayEmployee.id)}
                                </h3>

                                <p>
                                    {displayEmployee.department || "부서 없음"}
                                    {" · "}
                                    {displayEmployee.rank ||
                                        displayEmployee.position ||
                                        "직급 없음"}
                                </p>
                            </div>
                        </div>

                        {/* 업무 성과 카드 */}
                        <div className="ev-chart-stats">

                            <div>
                                <span>참여 프로젝트</span>
                                <strong>
                                    {getProjectCount(displayEmployee.id)}건
                                </strong>
                            </div>

                            <div>
                                <span>완료 이슈</span>
                                <strong>
                                    {getIssueCount(displayEmployee.id)}건
                                </strong>
                            </div>

                            <div>
                                <span>종합 평가 점수</span>
                                <strong>
                                    {chartEvaluation
                                        ? chartEvaluation.score
                                        : "-"} / 5
                                </strong>
                            </div>
                        </div>

                        {/* 평가 그래프 */}
                        {chartEvaluation ? (

                            <div className="ev-chart-bars">

                                <div className="ev-chart-heading">
                                    <h3>평가 항목별 점수</h3>

                                    <span className="ev-status">
                                        {chartEvaluation.status}
                                    </span>
                                </div>

                                <p className="ev-chart-period">
                                    평가 기간: {chartEvaluation.period}
                                </p>

                                {scoreItems.map(function (item) {

                                    const score = Number(
                                        chartEvaluation[item.key] || 0
                                    );

                                    return (
                                        <div
                                            className="ev-chart-row"
                                            key={item.key}
                                        >
                                            <span className="ev-chart-label">
                                                {item.title}
                                            </span>

                                            <div className="ev-chart-track">

                                                <div
                                                    className="ev-chart-fill"
                                                    style={{
                                                        width: (score / 5 * 100) + "%"
                                                    }}
                                                />

                                            </div>

                                            <strong>
                                                {score} / 5
                                            </strong>
                                        </div>
                                    );
                                })}

                                <div className="ev-chart-feedback">

                                    <strong>평가 의견</strong>

                                    <p>
                                        {chartEvaluation.feedback}
                                    </p>
                                </div>
                            </div>

                        ) : (

                            <div className="ev-chart-empty">
                                조회 가능한 평가가 없습니다.
                                평가가 등록되거나 승인되면
                                그래프가 표시됩니다.
                            </div>
                        )}
                    </div>

                ) : (

                    <p className="ev-empty">
                        조회할 직원이 없습니다.
                    </p>
                )}
            </div>

            {/* ==========================================
                평가 등록 및 수정
            ========================================== */}

            {showForm && canEvaluate && (

                <form
                    className="ev-panel ev-form"
                    onSubmit={addEvaluation}
                >

                    <h3>
                        {editingId !== null
                            ? "평가 내용 수정"
                            : "신규 평가 등록"}
                    </h3>

                    <div className="ev-form-grid">

                        <label>
                            평가 대상 직원

                            <select
                                value={selectedEmployeeId}
                                onChange={function (event) {
                                    setSelectedEmployeeId(event.target.value);
                                }}
                            >
                                <option value="">직원 선택</option>

                                {employees
                                    .filter(function (employee) {
                                        return (
                                            String(employee.id) !==
                                            String(loginEmployee?.id)
                                        );
                                    })
                                    .map(function (employee) {

                                        return (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employeeName(employee.id)}
                                            </option>
                                        );
                                    })}
                            </select>
                        </label>

                        <label>
                            평가 기간

                            <input
                                type="text"
                                value={period}
                                onChange={function (event) {
                                    setPeriod(event.target.value);
                                }}
                            />
                        </label>
                    </div>

                    {/* 평가 점수 입력 */}
                    <div className="ev-score-grid">

                        {[
                            {
                                title: "프로젝트 기여도",
                                value: projectScore,
                                setter: setProjectScore
                            },
                            {
                                title: "이슈 해결 품질",
                                value: issueScore,
                                setter: setIssueScore
                            },
                            {
                                title: "협업 및 소통",
                                value: teamworkScore,
                                setter: setTeamworkScore
                            },
                            {
                                title: "일정 준수",
                                value: scheduleScore,
                                setter: setScheduleScore
                            }
                        ].map(function (item) {

                            return (
                                <label key={item.title}>
                                    {item.title}

                                    <select
                                        value={item.value}
                                        onChange={function (event) {
                                            item.setter(event.target.value);
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5].map(function (score) {

                                            return (
                                                <option
                                                    key={score}
                                                    value={score}
                                                >
                                                    {score}점
                                                </option>
                                            );
                                        })}
                                    </select>
                                </label>
                            );
                        })}
                    </div>

                    <div className="ev-total">
                        <span>종합 평가 점수</span>

                        <strong>
                            {calculateScore().toFixed(2)} / 5
                        </strong>
                    </div>

                    <label className="ev-feedback-label">
                        평가 의견

                        <textarea
                            rows={4}
                            value={feedback}
                            placeholder="평가 근거와 의견을 입력하세요."
                            onChange={function (event) {
                                setFeedback(event.target.value);
                            }}
                        />
                    </label>

                    <div className="ev-form-actions">

                        <button type="submit">
                            {editingId !== null
                                ? "수정 완료"
                                : "평가 저장"}
                        </button>

                        <button
                            type="button"
                            className="secondary"
                            onClick={resetForm}
                        >
                            취소
                        </button>
                    </div>
                </form>
            )}

            {/* ==========================================
                평가 승인 및 수정 관리
            ========================================== */}

            <div className="ev-panel">

                <div className="ev-panel-head">

                    <h3>평가 등록 및 승인 현황</h3>

                    <input
                        type="text"
                        placeholder="직원 이름 검색"
                        value={search}
                        onChange={function (event) {
                            setSearch(event.target.value);
                        }}
                    />
                </div>

                {filteredEvaluations.length === 0 ? (

                    <p className="ev-empty">
                        조회 가능한 평가가 없습니다.
                    </p>

                ) : (

                    <div className="ev-review-list">

                        {filteredEvaluations.map(function (evaluation) {

                            const isWriter =
                                String(evaluation.evaluatorId) ===
                                String(loginEmployee?.id);

                            const isTarget =
                                String(evaluation.employeeId) ===
                                String(loginEmployee?.id);

                            const canEdit =
                                isWriter &&
                                (
                                    evaluation.status === "초안" ||
                                    evaluation.status === "반려"
                                );

                            const canApprove =
                                canEvaluate &&
                                !isWriter &&
                                !isTarget &&
                                evaluation.status === "승인 요청";

                            return (
                                <div
                                    className="ev-review-item"
                                    key={evaluation.id}
                                >

                                    <div className="ev-review-title">

                                        <div>
                                            <strong>
                                                {employeeName(evaluation.employeeId)}
                                            </strong>

                                            <p>
                                                {evaluation.period}
                                                {" · 평가자 "}
                                                {employeeName(evaluation.evaluatorId)}
                                            </p>
                                        </div>

                                        <span className="ev-status">
                                            {evaluation.status}
                                        </span>
                                    </div>

                                    <div className="ev-review-score">

                                        <strong>
                                            {evaluation.score} / 5
                                        </strong>

                                        <span>
                                            {evaluation.feedback}
                                        </span>
                                    </div>

                                    {evaluation.rejectReason && (

                                        <p className="ev-reject-reason">
                                            반려 사유: {evaluation.rejectReason}
                                        </p>
                                    )}

                                    <div className="ev-review-actions">

                                        {canEdit && (

                                            <button
                                                type="button"
                                                className="secondary"
                                                onClick={function () {
                                                    editEvaluation(evaluation);
                                                }}
                                            >
                                                평가 수정
                                            </button>
                                        )}

                                        {isWriter &&
                                            evaluation.status === "초안" && (

                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        changeStatus(
                                                            evaluation,
                                                            "승인 요청"
                                                        );
                                                    }}
                                                >
                                                    승인 요청
                                                </button>
                                            )}

                                        {canApprove && (

                                            <>
                                                <button
                                                    type="button"
                                                    onClick={function () {
                                                        changeStatus(
                                                            evaluation,
                                                            "승인"
                                                        );
                                                    }}
                                                >
                                                    승인
                                                </button>

                                                <button
                                                    type="button"
                                                    className="secondary"
                                                    onClick={function () {
                                                        changeStatus(
                                                            evaluation,
                                                            "반려"
                                                        );
                                                    }}
                                                >
                                                    반려
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


        </div>
    );
}

export default EmployeeEvaluation;
