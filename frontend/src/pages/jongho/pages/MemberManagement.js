import React, { Fragment, useState } from "react";
import { PROJECT_STATUS } from "../shared/projectConstants";
import { findEmployee } from "../shared/employees";
import { canLeadProject } from "../shared/permissions";
import EmployeePicker from "../components/EmployeePicker";
import { matchesProjectSearch } from "../utils/projectFilters";
import usePagination from "../utils/usePagination";
import NumberedPager from "../components/NumberedPager";
import SearchSortBar from "../components/SearchSortBar";
import { compareText, compareNumber, descending, sortByOption } from "../utils/listSort";

const MEMBER_PAGE_SIZE = 10;

// 정렬 선택지 (희승 님 인사관리 화면의 정렬 드롭다운과 같은 방식)
const SORT_OPTIONS = [
    { value: "default", label: "기본순" },
    { value: "name", label: "프로젝트명순" },
    { value: "status", label: "진행 상태순" },
    { value: "manager", label: "담당자순" },
    { value: "members", label: "팀원 많은순" },
    { value: "assigned", label: "배정 상태순" },
];

// 인원 관리: 프로젝트별 담당자(팀장 이상 1명)와 팀원을 배정합니다.
function MemberManagement({
    projects = [],
    updateProject,
    updateProjectMembers,
    employees = []
}) {

    // 검색어
    const [search, setSearch] = useState("");
    // 정렬 선택 (드롭다운)
    const [sortOption, setSortOption] = useState("default");
    // 팀원 편집 중인 프로젝트와 임시 선택 목록
    const [editingId, setEditingId] = useState(null);
    const [draftMemberIds, setDraftMemberIds] = useState([]);
    const [saving, setSaving] = useState(false);

    // 직원 찾기 (번호가 없으면 null)
    const findEmployeeOf = (id) => id == null ? null : findEmployee(employees, id);
    const activeEmployees = employees.filter((e) => e.status === "재직");

    // 담당자 칸에 보이는 글자 그대로
    const getManagerLabel = (project) => {
        if (project.managerId == null) return "미배정";
        const manager = findEmployeeOf(project.managerId);
        if (!manager) return `ID: ${project.managerId}`;
        if (!canLeadProject(manager)) return "미배정";
        return manager.name;
    };

    // 정렬용 값
    const getSortValue = (project, key) => {
        if (key === "manager") return getManagerLabel(project);
        if (key === "assigned") {
            const manager = findEmployeeOf(project.managerId);
            return manager && canLeadProject(manager) ? "배정 완료" : "배정 없음";
        }
        if (key === "members") return (project.memberIds || []).length;
        return project[key] ?? "";
    };

    // 화면에 보일 프로젝트 목록 (필터 후 정렬)
    const filteredProjects = projects
        .filter((project) => !["승인 대기", "반려"].includes(project.status))
        .filter((project) => matchesProjectSearch(project, search));
    // 선택한 항목 기준 정렬 (기본순은 원래 등록 순서 그대로)
    const sortRules = {
        name: (a, b) => compareText(getSortValue(a, "name"), getSortValue(b, "name")),
        status: (a, b) => compareText(getSortValue(a, "status"), getSortValue(b, "status")),
        manager: (a, b) => compareText(getSortValue(a, "manager"), getSortValue(b, "manager")),
        members: descending((a, b) => compareNumber(getSortValue(a, "members"), getSortValue(b, "members"))),
        assigned: (a, b) => compareText(getSortValue(a, "assigned"), getSortValue(b, "assigned")),
    };
    const sortedProjects = sortByOption(filteredProjects, sortOption, sortRules);

    // 한 페이지 10개씩 (검색이나 정렬이 바뀌면 1페이지로)
    const { pageItems: pagedProjects, currentPage, totalPages, total, goTo } =
        usePagination(sortedProjects, MEMBER_PAGE_SIZE, [search, sortOption]);
    const pageOffset = (currentPage - 1) * MEMBER_PAGE_SIZE;

    // 프로젝트 담당자 배정
    const assignManager = async (projectId, managerId) => {

        //완료된 프로젝트는 담당자 재배정 불가
        const currentProject = projects.find((p) => p.id === projectId)
        if (currentProject && currentProject.status === PROJECT_STATUS.DONE) {
            window.alert("완료된 프로젝트는 담당자를 변경할 수 없습니다.");
            return;
        }

        if (managerId !== null && !canLeadProject(findEmployeeOf(managerId))) {
            window.alert("팀장 이상 직급만 담당자로 배정할 수 있습니다.");
            return;
        }

        // 확인 창: 취소하면 아무 것도 바뀌지 않음
        const target = managerId !== null
            ? findEmployeeOf(managerId)
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
                status: currentProject.status === PROJECT_STATUS.ON_HOLD ? PROJECT_STATUS.ON_HOLD : managerId !== null ? PROJECT_STATUS.IN_PROGRESS : PROJECT_STATUS.PLANNED
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
                <SearchSortBar
                    searchId="member-search"
                    placeholder="프로젝트명 또는 고객사 검색"
                    search={search}
                    onSearchChange={setSearch}
                    selects={[
                        { id: "member-sort", label: "정렬 기준", value: sortOption, onChange: setSortOption, options: SORT_OPTIONS },
                    ]}
                />
                <div className="nexus-assignment-table-wrap">

                    <table className="nexus-assignment-table">

                        <thead>
                            <tr>
                                <th>번호</th>
                                <th>프로젝트명</th>
                                <th>진행 상태</th>
                                <th>담당자</th>
                                <th>팀원</th>
                                <th>배정 상태</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pagedProjects
                                .map((project, index) => {
                                    // 드롭다운 선택지(팀장 이상)에 있는 담당자만 실제 배정으로 인정
                                    const assignedManager = findEmployeeOf(project.managerId);
                                    const hasManager = canLeadProject(assignedManager);
                                    const isEditing = editingId === project.id;
                                    const memberCount = (project.memberIds || []).length;

                                    return (
                                        <Fragment key={project.id}>
                                            <tr>

                                                <td>{pageOffset + index + 1}</td>
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
                                                    ) : (
                                                        <span className="badge badge-pending">
                                                            배정 없음
                                                        </span>
                                                    )}
                                                </td>

                                            </tr>

                                            {isEditing && (
                                                <tr>
                                                    <td colSpan={6}>
                                                        {(() => {
                                                            const managerNo = project.managerId;
                                                            const manager = findEmployeeOf(managerNo);
                                                            return (
                                                                <>
                                                                    <EmployeePicker
                                                                        employees={employees}
                                                                        selectedIds={draftMemberIds}
                                                                        excludedId={managerNo}
                                                                        lockedEmployee={manager}
                                                                        selectClassName="nexus-assignment-select"
                                                                        onAdd={addDraftMember}
                                                                        onRemove={removeDraftMember}
                                                                    />
                                                                </>
                                                            );
                                                        })()}
                                                        <div className="nexus-member-editor-actions">
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

                <NumberedPager currentPage={currentPage} totalPages={totalPages} total={total} pageSize={MEMBER_PAGE_SIZE} onPage={goTo} />

            </div>

        </div>
    );
}

export default MemberManagement;