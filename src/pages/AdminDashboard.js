
import { useEffect, useState } from "react";

function AdminDashboard({ onMenuChange }) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [employees, setEmployees] = useState([]);
    const [selectedBug, setSelectedBug] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState("");

    async function loadDashboard() {
        const response = await fetch(
            "http://localhost:3001/api/admin/dashboard"
        );

        if (!response.ok) {
            throw new Error("대시보드 데이터를 불러오지 못했습니다.");
        }

        const data = await response.json();
        setDashboard(data);
    }

    useEffect(() => {
        async function initialize() {
            try {
                await loadDashboard();
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, []);

    async function openAssignModal(bug) {
        setSelectedBug(bug);
        setSelectedEmployee("");
        setAssignError("");

        try {
            const response = await fetch(
                "http://localhost:3001/api/employees"
            );

            if (!response.ok) {
                throw new Error("사원 목록을 불러오지 못했습니다.");
            }

            const data = await response.json();
            setEmployees(data);
        } catch (err) {
            setAssignError(err.message);
        }
    }

    async function assignBug() {
        if (!selectedBug || !selectedEmployee) {
            setAssignError("담당 사원을 선택해 주세요.");
            return;
        }

        try {
            setAssigning(true);
            setAssignError("");

            const response = await fetch(
                `http://localhost:3001/api/bugs/${encodeURIComponent(
                    selectedBug.bug_id
                )}/assign`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        employee_id: selectedEmployee,
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "담당자 지정에 실패했습니다."
                );
            }

            await loadDashboard();
            setSelectedBug(null);
        } catch (err) {
            setAssignError(err.message);
        } finally {
            setAssigning(false);
        }
    }

    if (loading) {
        return (
            <div className="admin-dashboard">
                데이터를 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                오류: {error}
            </div>
        );
    }

    const stats = [
        {
            title: "전체 사원",
            value: dashboard.summary.totalEmployees,
            unit: "명",
        },
        {
            title: "미배정 버그",
            value: dashboard.summary.unassignedBugs,
            unit: "건",
        },
        {
            title: "처리 지연",
            value: dashboard.summary.delayedProjects,
            unit: "건",
        },
        {
            title: "전체 평가",
            value: dashboard.summary.totalEvaluations,
            unit: "건",
        },
    ];

    return (
        <div className="admin-dashboard">
            <div style={{ marginBottom: 28 }}>
                <h2>관리자 대시보드</h2>
                <p>회사 운영 현황과 우선 처리할 업무를 확인하세요.</p>
            </div>

            <div className="admin-stats">
                {stats.map((stat) => (
                    <div className="admin-card" key={stat.title}>
                        <p>{stat.title}</p>
                        <strong>
                            {stat.value}
                            <span>{stat.unit}</span>
                        </strong>
                    </div>
                ))}
            </div>

            <section className="admin-section">
                <h3>담당자 미지정 버그</h3>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>버그 번호</th>
                            <th>버그 제목</th>
                            <th>프로젝트</th>
                            <th>심각도</th>
                            <th>상태</th>
                            <th>작업</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dashboard.unassignedBugs.length > 0 ? (
                            dashboard.unassignedBugs.map((bug) => (
                                <tr key={bug.bug_id}>
                                    <td>{bug.bug_id}</td>
                                    <td>{bug.bug_title}</td>
                                    <td>{bug.project_name ?? "-"}</td>
                                    <td>{bug.bug_severity ?? "-"}</td>
                                    <td>{bug.bug_status}</td>
                                    <td>
                                        <button onClick={() => openAssignModal(bug)}>
                                            담당자 지정
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6">
                                    담당자 미지정 버그가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="admin-section">
                <h3>최근 사원 평가</h3>

                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>사원명</th>
                            <th>평가 점수</th>
                            <th>평가 기간</th>
                            <th>평가 의견</th>
                        </tr>
                    </thead>

                    <tbody>
                        {dashboard.recentEvaluations.length > 0 ? (
                            dashboard.recentEvaluations.map((evaluation) => (
                                <tr key={evaluation.evaluation_id}>
                                    <td>{evaluation.employee_name}</td>
                                    <td>
                                        {evaluation.evaluation_score == null
                                            ? "-"
                                            : `${evaluation.evaluation_score}점`}
                                    </td>
                                    <td>
                                        {evaluation.evaluation_period
                                            ? String(evaluation.evaluation_period).slice(0, 10)
                                            : "-"}
                                    </td>
                                    <td>{evaluation.evaluation_comment ?? "-"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4">등록된 평가가 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <section className="admin-section">
                <h3>관리자 주요 업무</h3>

                <div className="admin-shortcuts">
                    <div className="admin-card"
                        onClick={() => onMenuChange("employees")}
                        role="button"
                        tabIndex={0}>
                        <h4>사원 관리</h4>
                        <p>사원 정보와 부서를 관리합니다.</p>
                    </div>

                    <div className="admin-card">
                        <h4>버그 배정</h4>
                        <p>버그 담당자를 지정하고 처리 현황을 확인합니다.</p>
                    </div>

                    <div className="admin-card">
                        <h4>프로젝트</h4>
                        <p>프로젝트 진행 현황을 확인합니다</p>
                    </div>

                    <div className="admin-card">
                        <h4>사원 평가</h4>
                        <p>버그 해결 결과를 바탕으로 평가를 기록합니다.</p>
                    </div>
                </div>
            </section>

            {selectedBug && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "#fff",
                            padding: 24,
                            borderRadius: 12,
                            width: "min(400px, 90vw)",
                            boxSizing: "border-box",
                        }}
                    >
                        <h3>버그 담당자 지정</h3>
                        <p>
                            {selectedBug.bug_id} · {selectedBug.bug_title}
                        </p>

                        <label htmlFor="employee-select">
                            담당 사원
                        </label>

                        <select
                            id="employee-select"
                            value={selectedEmployee}
                            onChange={(event) =>
                                setSelectedEmployee(event.target.value)
                            }
                            style={{
                                display: "block",
                                width: "100%",
                                padding: 10,
                                marginTop: 8,
                                marginBottom: 16,
                                boxSizing: "border-box",
                            }}
                        >
                            <option value="">사원을 선택하세요</option>
                            {employees.map((employee) => (
                                <option
                                    key={employee.employee_id}
                                    value={employee.employee_id}
                                >
                                    {employee.employee_name} (
                                    {employee.employee_id})
                                </option>
                            ))}
                        </select>

                        {employees.length === 0 && (
                            <p>등록된 사원이 없거나 사원 목록을 불러오지 못했습니다.</p>
                        )}

                        {assignError && (
                            <p style={{ color: "#d92d20" }}>{assignError}</p>
                        )}

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 8,
                            }}
                        >
                            <button
                                onClick={() => setSelectedBug(null)}
                                disabled={assigning}
                            >
                                취소
                            </button>

                            <button
                                onClick={assignBug}
                                disabled={assigning || employees.length === 0}
                            >
                                {assigning ? "저장 중..." : "담당자 지정"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
