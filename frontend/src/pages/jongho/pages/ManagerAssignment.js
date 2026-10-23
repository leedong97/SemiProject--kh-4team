import React from "react";
import { canLeadProject } from "../shared/permissions";

function ManagerAssignment({
    projects = [],
    setProjects,
    employees = []
}) {

    // 프로젝트 담당자 배정
    const assignManager = (projectId, managerId) => {

        if (managerId !== null && !employees.some(e => e.id === managerId && canLeadProject(e))) {
            window.alert("팀장 이상 직급만 담당자로 배정할 수 있습니다.");
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
                        status: managerId !== null
                            ? "진행중"
                            : "배정 대기"
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
                                .map((project) => (

                                    <tr key={project.id}>

                                        <td>{project.name}</td>

                                        <td>{project.status}</td>

                                        <td>
                                            <select
                                                className="nexus-assignment-select"
                                                value={project.managerId ?? ""}
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

                                                {employees.filter(canLeadProject).map((employee) => (
                                                    <option
                                                        key={employee.id}
                                                        value={employee.id}
                                                    >
                                                        {employee.name} ({employee.role})
                                                    </option>
                                                ))}

                                            </select>
                                        </td>

                                        <td>
                                            {project.managerId == null ? (
                                                <span className="badge badge-pending">
                                                    미배정
                                                </span>
                                            ) : (
                                                <span className="badge badge-done">
                                                    배정 완료
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default ManagerAssignment;