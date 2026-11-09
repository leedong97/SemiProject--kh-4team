import { canLeadProject } from "../shared/permissions";
import { PROJECT_STATUS } from "../shared/projectConstants";
import { findEmployee } from "../shared/employees";
import { getProgress } from "../utils/projectHelpers";

// 프로젝트 목록 표와 각 프로젝트의 관리 버튼을 보여줍니다.
const SORTABLE_COLUMNS = [
  ["name", "프로젝트명"],
  ["customer", "고객사"],
  ["status", "상태"],
  ["manager", "담당자"],
  ["endDate", "종료일"],
  ["progress", "진행률"]
];

export default function ProjectTable({
  startIndex = 0,
  projects = [],
  employees = [],
  isEmpty,
  isOverdue,
  onOpenProject,
  onManageMembers,
  onDeleteProject
}) {
  return (
    <div className="nexus-project-table-wrap">
      <table className="nexus-project-table">
        <thead>
          <tr>
            <th>번호</th>
            {SORTABLE_COLUMNS.map(([key, label]) => (
              <th key={key}>{label}</th>
            ))}
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project, index) => {
            const manager = findEmployee(employees, project.managerId);
            let managerName = "미배정";

            if (project.managerId != null) {
              if (!manager) managerName = `ID: ${project.managerId}`;
              else if (!canLeadProject(manager)) managerName = "미배정";
              else managerName = manager.name;
            }

            return (
              <tr key={project.id}>
                <td>{startIndex + index + 1}</td>
                <td>{project.name}</td>
                <td>{project.customer || "-"}</td>
                <td><span className="badge badge-info">{project.status}</span></td>
                <td>{managerName}</td>
                <td>
                  {project.endDate || "미정"}
                  {isOverdue(project) && (
                    <span className="nexus-overdue" aria-label="기간 초과">기간 초과</span>
                  )}
                </td>
                <td>{getProgress(project.progress)}%</td>
                <td>
                  <div className="nexus-project-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenProject(project.id)}
                    >
                      상세보기
                    </button>
                    {project.status !== PROJECT_STATUS.DONE && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={onManageMembers}
                      >
                        인원 관리
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onDeleteProject(project.id)}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {isEmpty && (
            <tr>
              <td colSpan="8">등록된 프로젝트가 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}