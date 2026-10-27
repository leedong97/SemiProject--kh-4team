import React from "react";
import { canLeadProject } from "../shared/permissions";

function ManagerAssignment({
    projects = [],
    setProjects,
    employees = []
}) {

    // 프로젝트 담당자 배정
    const assignManager = (projectId, managerId) => {

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

        setProjects((prev) =>
            prev.map((project) => {

                // 선택한 프로젝트인지 확인
                if (project.id === projectId) {

                    return {
                        ...project,

                        // 담당자 ID 저장
                        managerId: managerId,

                        // 담당자가 있으면 진행중으로 변경
                        // 담당자를 해제하면 배정 대기로 변경
                        status: project.status === "보류"
                            ? "보류"
                            : managerId !== null
                                ? "진행중"
                                : "예정"
                    };
                }

                return project;
            })
        );
    };
    return (
        <div className="nexus-assignment">

            <h1>담당자 배정</h1>

            <p className="nexus-assignment-description">
                팀장 이상 직급의 직원만 프로젝트 책임자로 배정할 수 있습니다.
            </p>

            <div className="card">

                <div className="nexus-assignment-table-wrap">

                    <table className="nexus-assignment-table">

                        <thead>
                            <tr>
                                <th>프로젝트명</th>
                                <th>진행 상태</th>
                                <th>담당자</th>
                                <th>배정 상태</th>
                            </tr>
                        </thead>

                        <tbody>
                            {projects
                                .filter((project) =>
                                    project.status !== "승인 대기" &&
                                    project.status !== "반려"
                                )
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