import React, { Fragment, useState } from "react";
import { canLeadProject } from "../shared/permissions";
import { matchesProjectSearch } from "../utils/projectFilters";
import useSortableList from "../utils/useSortableList";

// 인원 관리: 프로젝트별 담당자(팀장 이상 1명)와 팀원을 배정합니다.
function MemberManagement({
    projects = [],
    updateProject,
    updateProjectMembers,
    employees = []
}) {

    // 검색어
    const [search, setSearch] = useState("");
    // 팀원 편집 중인 프로젝트와 임시 선택 목록
    const [editingId, setEditingId] = useState(null);
    const [draftMemberIds, setDraftMemberIds] = useState([]);
    const [saving, setSaving] = useState(false);

    const findEmployee = (id) => id == null ? null : employees.find((employee) => String(employee.id) === String(id));
    const activeEmployees = employees.filter((e) => e.status === "재직");

    // 담당자 칸에 보이는 글자 그대로
    const getManagerLabel = (project) => {
        if (project.managerId == null) return "미배정";
        const manager = findEmployee(project.managerId);
        if (!manager) return `ID: ${project.managerId}`;
        if (!canLeadProject(manager)) return `직급 미달 담당자 (${manager.name})`;
        return manager.name;
    };

    // 정렬용 값
    const getSortValue = (project, key) => {
        if (key === "manager") return getManagerLabel(project);
        if (key === "assigned") {
            const manager = findEmployee(project.managerId);
            return manager && canLeadProject(manager) ? "배정 완료" : "배정 없음";
        }
        if (key === "members") return (project.memberIds || []).length;
        return project[key] ?? "";
    };
    const { changeSort, sortItems, sortMark } = useSortableList(getSortValue);

    // 화면에 보일 프로젝트 목록 (필터 후 정렬)
    const filteredProjects = projects
        .filter((project) => !["승인 대기", "반려"].includes(project.status))
        .filter((project) => matchesProjectSearch(project, search));
    const sortedProjects = sortItems(filteredProjects);

    // 프로젝트 담당자 배정
    const assignManager = async (projectId, managerId) => {

        //완료된 프로젝트는 담당자 재배정 불가
        const currentProject = projects.find((p) => p.id === projectId)
        if (currentProject && currentProject.status === "완료") {
            window.alert("완료된 프로젝트는 담당자를 변경할 수 없습니다.");
            return;
        }

        if (managerId !== null && !canLeadProject(findEmployee(managerId))) {
            window.alert("팀장 이상 직급만 담당자로 배정할 수 있습니다.");
            return;
        }

        // 확인 창: 취소하면 아무 것도 바뀌지 않음
        const target = managerId !== null
            ? findEmployee(managerId)
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

    // 팀원 편집 열기: 현재 명단을 임시 목록으로 복사
    const openMemberEditor = (project) => {
        setEditingId(project.id);
        // 담당자는 팀원 목록(드래프트)에 넣지 않는다. 담당자는 담당자 칸에서만 바꾼다.
        setDraftMemberIds((project.memberIds || []).filter((id) => String(id) !== String(project.managerId)));
    };

    const closeMemberEditor = () => {
        setEditingId(null);
        setDraftMemberIds([]);
    };

    const addDraftMember = (employeeId) => {
        setDraftMemberIds((prev) => (prev.includes(employeeId) ? prev : [...prev, employeeId]));
    };

    const removeDraftMember = (employeeId) => {
        setDraftMemberIds((prev) => prev.filter((id) => id !== employeeId));
    };

    // 팀원 저장 (담당자는 서버에서 자동으로 명단에 포함됨)
    const saveMembers = async (projectId) => {
        setSaving(true);
        try {
            await updateProjectMembers(projectId, draftMemberIds);
            closeMemberEditor();
        } catch (error) {
            alert('팀원 배정 저장 실패: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="nexus-assignment">

            <h1>인원 관리</h1>

            <p className="nexus-assignment-description">
                프로젝트의 담당자(팀장 이상)와 팀원을 배정합니다. 담당자는 자동으로 팀원 명단에도 포함됩니다.
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
                                <th onClick={() => changeSort("members")} style={{ cursor: "pointer" }}>팀원{sortMark("members")}</th>
                                <th onClick={() => changeSort("assigned")} style={{ cursor: "pointer" }}>배정 상태{sortMark("assigned")}</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedProjects
                                .map((project) => {
                                    // 드롭다운 선택지(팀장 이상)에 있는 담당자만 실제 배정으로 인정
                                    const assignedManager = findEmployee(project.managerId);
                                    const hasManager = canLeadProject(assignedManager);
                                    const underRankManager = !hasManager ? assignedManager : null;
                                    const isEditing = editingId === project.id;
                                    const memberCount = (project.memberIds || []).length;

                                    return (
                                        <Fragment key={project.id}>
                                            <tr>

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

                                                        {activeEmployees.filter((e) => canLeadProject(e)).map((employee) => (
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
                                                    <button className="btn btn-outline btn-sm"
                                                        type="button"
                                                        disabled={project.status === "완료"}
                                                        onClick={() => isEditing ? closeMemberEditor() : openMemberEditor(project)}
                                                    >
                                                        {isEditing ? "닫기" : `팀원 ${memberCount}명 · 편집`}
                                                    </button>
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

                                            {isEditing && (
                                                <tr>
                                                    <td colSpan={5}>
                                                        {(() => {
                                                            const managerNo = project.managerId;
                                                            const addable = activeEmployees.filter(
                                                                (e) => !draftMemberIds.includes(e.id) && String(e.id) !== String(managerNo)
                                                            );
                                                            const chosen = activeEmployees.filter(
                                                                (e) => draftMemberIds.includes(e.id) && String(e.id) !== String(managerNo)
                                                            );
                                                            const manager = findEmployee(managerNo);
                                                            return (
                                                                <>
                                                                    <select
                                                                        className="nexus-assignment-select"
                                                                        value=""
                                                                        onChange={(e) => e.target.value && addDraftMember(Number(e.target.value))}
                                                                    >
                                                                        <option value="">팀원을 선택하면 추가됩니다</option>
                                                                        {addable.map((employee) => (
                                                                            <option key={employee.id} value={employee.id}>
                                                                                {employee.name} ({employee.rank} · {employee.position})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div style={{ marginTop: "10px" }}>
                                                                        {manager && (
                                                                            <span style={{ display: "inline-flex", gap: "6px", padding: "4px 10px", border: "1px solid #999", borderRadius: "14px", margin: "0 6px 6px 0" }}>
                                                                                {manager.name} (담당자)
                                                                            </span>
                                                                        )}
                                                                        {chosen.map((employee) => (
                                                                            <span key={employee.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", border: "1px solid #ccc", borderRadius: "14px", margin: "0 6px 6px 0" }}>
                                                                                {employee.name} ({employee.rank})
                                                                                <button type="button" onClick={() => removeDraftMember(employee.id)}>×</button>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                                                            <button className="btn btn-primary btn-sm"
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => saveMembers(project.id)}
                                                            >
                                                                {saving ? "저장 중…" : "팀원 저장"}
                                                            </button>
                                                            <button className="btn btn-outline btn-sm"
                                                                type="button"
                                                                onClick={closeMemberEditor}
                                                            >
                                                                취소
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}

export default MemberManagement;
