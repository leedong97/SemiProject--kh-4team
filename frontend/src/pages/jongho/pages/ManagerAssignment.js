import React, { useState } from "react";
import { canLeadProject } from "../shared/permissions";

function ManagerAssignment({
    projects = [],
    setProjects,
    updateProject,
    employees = []
}) {

    // ===== 정렬 =====
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    // 검색어
    const [search, setSearch] = useState("");

    // 담당자 칸에 보이는 글자 그대로
    const getManagerLabel = (project) => {
        if (project.managerId == null) return "미배정";
        const manager = employees.find((e) => String(e.id) === String(project.managerId));
        if (!manager) return `ID: ${project.managerId}`;
        if (!canLeadProject(manager)) return `직급 미달 담당자 (${manager.name})`;
        return manager.name;
    };

    // 정렬용 값
    const getSortValue = (project) => {
        if (sortKey === "manager") return getManagerLabel(project);
        if (sortKey === "assigned") {
            const manager = employees.find((e) => String(e.id) === String(project.managerId));
            return manager && canLeadProject(manager) ? "배정 완료" : "배정 없음";
        }
        return project[sortKey] ?? "";
    };

    // 화면에 보일 프로젝트 목록 (필터 후 정렬)
    const sortedProjects = projects
        .filter((project) =>
            project.status !== "승인 대기" &&
            project.status !== "반려"
        )
        .filter((project) => {
            const keyword = search.toLowerCase();
            return (
                (project.name || "").toLowerCase().includes(keyword) ||
                (project.customer || "").toLowerCase().includes(keyword)
            );
        })
        .sort((a, b) => {
            if (!sortKey) return 0;
            const result = String(getSortValue(a)).localeCompare(String(getSortValue(b)), "ko");
            return sortDir === "asc" ? result : -result;
        });

    // 헤더 클릭: 같은 항목이면 방향 전환, 다른 항목이면 오름차순
    const changeSort = (key) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const sortMark = (key) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

    // 프로젝트 담당자 배정
    const assignManager = async (projectId, managerId) => {

        //완료된 프로젝트는 담당자 재배정 불가

        const currentProject = projects.find((p) => p.id === projectId)
        if (currentProject && currentProject.status === "완료") {
            window.alert("완료된 프로젝트는 담당자를 변경할 수 없습니다.");
            return;
        }

        if (managerId !== null && !employees.some(e => e.id === managerId && canLeadProject(e))) {
            window.alert("팀장 이상 직급만 담당자로 배정할 수 있습니다.");
            return;
        }

        // 확인 창: 취소하면 아무 것도 바뀌지 않음
        const target = managerId !== null
            ? employees.find((e) => e.id === managerId)
            : null;
        const message = target
            ? `${target.name} 님을 담당자로 배정하시겠습니까?`
            : "담당자 배정을 해제하시겠습니까?";
        if (!window.confirm(message)) {
            return;
        }

        try {
            await updateProject(projectId, {
                managerId: managerId,
                status: currentProject.status === '보류' ? '보류' : managerId !== null ? '진행중' : '예정'
            });
        } catch (error) {
            alert('DB 담당자 변경 실패: ' + error.message);
        }
    };
    return (
        <div className="nexus-assignment">

            <h1>담당자 배정</h1>

            <p className="nexus-assignment-description">
                팀장 이상 직급의 직원만 프로젝트 책임자로 배정할 수 있습니다.
            </p>

            <div className="card">
                <input
                    className="nexus-project-input"
                    placeholder="프로젝트명 또는 고객사 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ marginBottom: "16px" }}
                />
                <div className="nexus-assignment-table-wrap">

                    <table className="nexus-assignment-table">

                        <thead>
                            <tr>
                                <th onClick={() => changeSort("name")} style={{ cursor: "pointer" }}>프로젝트명{sortMark("name")}</th>
                                <th onClick={() => changeSort("status")} style={{ cursor: "pointer" }}>진행 상태{sortMark("status")}</th>
                                <th onClick={() => changeSort("manager")} style={{ cursor: "pointer" }}>담당자{sortMark("manager")}</th>
                                <th onClick={() => changeSort("assigned")} style={{ cursor: "pointer" }}>배정 상태{sortMark("assigned")}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedProjects
                                .map((project) => {
                                    // 드롭다운 선택지(팀장 이상)에 있는 담당자만 실제 배정으로 인정
                                    const currentManager = employees.find(
                                        (e) => e.id === project.managerId && canLeadProject(e)
                                    );
                                    const hasManager = Boolean(currentManager);

                                    // 담당자는 있지만 팀장 미만이라 선택지에 없는 경우
                                    const underRankManager = !hasManager && project.managerId != null
                                        ? employees.find((e) => e.id === project.managerId)
                                        : null;

                                    return (

                                        <tr key={project.id}>

                                            <td>{project.name}</td>

                                            <td>{project.status}</td>

                                            <td>
                                                <select
                                                    className="nexus-assignment-select"
                                                    disabled={project.status === "완료"}
                                                    value={hasManager ? project.managerId : ""}
                                                    onChange={(e) =>
                                                        assignManager(
                                                            project.id,
                                                            e.target.value
                                                                ? Number(e.target.value)
                                                                : null
                                                        )
                                                    }
                                                >
                                                    <option value="">담당자 선택</option>

                                                    {employees.filter((e) => e.status === "재직" && canLeadProject(e)).map((employee) => (
                                                        <option
                                                            key={employee.id}
                                                            value={employee.id}
                                                        >
                                                            {employee.name} ({employee.rank} · {employee.position})
                                                        </option>
                                                    ))}

                                                </select>
                                            </td>

                                            <td>
                                                {hasManager ? (
                                                    <span className="badge badge-done">
                                                        배정 완료
                                                    </span>
                                                ) : underRankManager ? (
                                                    <span className="badge badge-pending">
                                                        직급 미달 담당자 ({underRankManager.name})
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-pending">
                                                        배정 없음
                                                    </span>
                                                )}
                                            </td>

                                        </tr>
                                    );
                                })}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default ManagerAssignment;