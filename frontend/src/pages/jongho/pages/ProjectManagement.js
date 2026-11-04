import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { canLeadProject } from "../shared/permissions";
import { adminRequest, getPendingProjectRequests } from "../adminApi";
import { matchesProjectSearch } from "../utils/projectFilters";
import useSortableList from "../utils/useSortableList";
import { PROJECT_STATUS_OPTIONS, DEFAULT_PROJECT_STATUS } from "../shared/projectConstants";
import ProjectRequestList from "../components/ProjectRequestList";
import ProjectRegisterForm from "../components/ProjectRegisterForm";
import ProjectDetail from "../components/ProjectDetail";
import { getProgress, isInvalidDateRange } from "../utils/projectHelpers";

// 담당자 ID로 직원 찾기 (문자열/숫자 ID 차이를 한 곳에서 처리)
const findEmployee = (employees, id) =>
  employees.find((e) => String(e.id) === String(id));

// 목록 표의 정렬 가능한 열 (키, 표시 이름)
const SORTABLE_COLUMNS = [
  ["name", "프로젝트명"],
  ["customer", "고객사"],
  ["status", "상태"],
  ["manager", "담당자"],
  ["endDate", "종료일"],
  ["progress", "진행률"],
];


function ProjectManagement({
  projects = [],
  setProjects,
  reloadProjects,
  createProject,
  removeProject,
  employees = []
}) {

  const navigate = useNavigate();

  // 대시보드에서 ?project=번호 로 넘어오면 해당 프로젝트 상세를 엽니다
  const [searchParams] = useSearchParams();
  const focusProjectId = searchParams.get("project");
  const openedProjectRef = useRef(null);

  // 현재 화면: list(목록), register(등록), detail(상세정보)
  const [page, setPage] = useState("list");



  // 프로젝트 검색어
  const [search, setSearch] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // 상세정보를 볼 프로젝트 ID
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // 대기 중인 완료 요청 목록 (requests 테이블)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestBusy, setRequestBusy] = useState(false);

  // 신규 프로젝트 입력 데이터
  const [form, setForm] = useState({
    customer: "",
    name: "",
    startDate: "",
    endDate: "",
    budget: "",
    description: ""
  });

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 프로젝트 등록
  const registerProject = async (e) => {
    e.preventDefault();

    if (!form.customer.trim() || !form.name.trim() || !form.description.trim()) {
      alert("고객사, 프로젝트명, 설명을 입력하세요.");
      return;
    }

    if (isInvalidDateRange(form.startDate, form.endDate)) {
      alert("종료 예정일은 시작 예정일 이후여야 합니다.");
      return;
    }

    if (
      form.budget !== "" &&
      (!Number.isFinite(Number(form.budget)) ||
        Number(form.budget) < 0)
    ) {
      alert("계약 금액을 올바르게 입력하세요.");
      return;
    }

    const newProject = {
      id: Date.now(),
      customer: form.customer.trim(),
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget || 0),
      description: form.description,
      status: DEFAULT_PROJECT_STATUS,
      progress: 0,
      plannedProgress: 0,
      managerId: null
    };

    try {
      await createProject(newProject);
    } catch (error) {
      alert('DB 등록 실패: ' + error.message);
      return;
    }

    alert("프로젝트가 등록되었습니다. 담당자를 배정할 수 있습니다.");

    setForm({
      customer: "",
      name: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: ""
    });

    setPage("list");
  };

  // 프로젝트 삭제
  const deleteProject = async (id) => {
    if (!window.confirm("프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await removeProject(id);
    } catch (error) { alert('삭제 실패: ' + error.message); }
  };

  // 오늘 기준으로 종료일이 지난 프로젝트인지 확인 (완료된 프로젝트는 제외)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = (project) => {
    if (!project.endDate || project.status === "완료") return false;
    const endDate = new Date(`${project.endDate}T00:00:00`);
    return !Number.isNaN(endDate.getTime()) && endDate < today;
  };

  // 프로젝트 검색
  const filteredProjects = projects
    .filter((project) => matchesProjectSearch(project, search))
    .filter((project) => !overdueOnly || isOverdue(project));
  const overdueCount = projects.filter(isOverdue).length;

  // 정렬용 값: 담당자는 화면에 보이는 이름 기준으로 정렬
  const getSortValue = (project, key) => {
    if (key === "manager") {
      if (project.managerId == null) return "미배정";
      const manager = findEmployee(employees, project.managerId);
      if (!manager) return `ID: ${project.managerId}`;
      return manager.name;
    }
    return project[key] ?? "";
  };
  const { changeSort, sortItems, sortMark } = useSortableList(getSortValue);

  const sortedProjects = sortItems(filteredProjects);



  // 상세정보 열기
  const openDetail = (id) => {
    setSelectedProjectId(id);
    setPage("detail");
  };

  // 대시보드에서 넘어온 프로젝트 상세를 한 번만 엽니다
  useEffect(() => {
    if (!focusProjectId || openedProjectRef.current === focusProjectId) return;
    if (!projects.some((p) => String(p.id) === focusProjectId)) return;
    openedProjectRef.current = focusProjectId;
    openDetail(Number(focusProjectId));
  }, [focusProjectId, projects]);

  // 목록으로 돌아가기
  const closeDetail = () => {
    setSelectedProjectId(null);
    setPage("list");
  };

  // 선택한 프로젝트 찾기
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );

  // 선택한 프로젝트 담당자 찾기
  const selectedManager = findEmployee(employees, selectedProject?.managerId);

  // 담당자가 있지만 팀장 미만(직급 미달)인지 확인
  const isUnderRankManager = (project) => {
    const manager = findEmployee(employees, project.managerId);
    return Boolean(manager) && !canLeadProject(manager);
  };

  // 대기 중인 완료 요청 다시 불러오기
  const loadPendingRequests = async () => {
    try {
      const rows = await getPendingProjectRequests();
      setPendingRequests(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPendingRequests([]);
    }
  };

  // 선택한 프로젝트에 대기 중인 요청 찾기
  const pendingFor = (projectId) =>
    pendingRequests.find((req) => String(req.projectId) === String(projectId));

  // 완료 요청 승인: 서버에서 프로젝트를 완료로 바꾸고, 화면 상태도 맞춤
  const approveRequest = async (req) => {
    const name = req.projectName || req.title;
    const isRegister = req.type === "등록";
    const question = isRegister
      ? `"${name}" 프로젝트를 등록할까요?`
      : `"${name}" 프로젝트를 완료 처리할까요?`;
    if (!window.confirm(question)) return;
    setRequestBusy(true);
    try {
      await adminRequest(`/project-requests/${req.id}/approve`, { method: "POST" });
      if (isRegister) {
        // 새 프로젝트가 생겼으므로 프로젝트 목록을 서버에서 다시 불러옴
        if (reloadProjects) await reloadProjects();
      } else {
        setProjects((prev) =>
          prev.map((p) =>
            String(p.id) === String(req.projectId) ? { ...p, status: "완료", progress: 100 } : p
          )
        );
      }
      await loadPendingRequests();
      alert(isRegister ? "프로젝트를 등록했습니다." : "프로젝트를 완료 처리했습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestBusy(false);
    }
  };

  // 완료 요청 반려: 사유를 입력받아 서버에 저장
  const rejectRequest = async (req, reason) => {
    setRequestBusy(true);
    try {
      await adminRequest(`/project-requests/${req.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      await loadPendingRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestBusy(false);
    }
  };

  // 화면이 열릴 때 대기 요청 목록 불러오기
  useEffect(() => {
    loadPendingRequests();
  }, []);

  return (
    <div className="nexus-project-management">

      {/* ============================= */}
      {/* 1. 프로젝트 목록 화면 */}
      {/* ============================= */}

      {page === "list" ? (
        <>
          <div className="nexus-project-heading">
            <div>
              <p>관리자 / 프로젝트 관리</p>
              <h2>프로젝트 관리</h2>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setPage("register")}
            >
              + 신규 프로젝트 등록
            </button>
          </div>

          <div className="card nexus-project-panel">

            <input
              className="nexus-project-input"
              placeholder="프로젝트명 또는 고객사 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline"
              aria-pressed={overdueOnly}
              onClick={() => setOverdueOnly((current) => !current)}
            >
              {overdueOnly ? "전체 프로젝트 보기" : `기간 초과만 보기 (${overdueCount})`}
            </button>

            {pendingRequests.length > 0 && (
              <ProjectRequestList
                requests={pendingRequests}
                busy={requestBusy}
                onOpenProject={openDetail}
                onApprove={approveRequest}
                onReject={rejectRequest}
              />
            )}

            <div className="nexus-project-table-wrap">
              <table className="nexus-project-table">

                <thead>
                  <tr>
                    {SORTABLE_COLUMNS.map(([key, label]) => (
                      <th key={key} className="nexus-sortable" onClick={() => changeSort(key)}>
                        {label}{sortMark(key)}
                      </th>
                    ))}
                    <th>관리</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedProjects.map((project) => (
                    <tr key={project.id}>

                      <td>{project.name}</td>

                      <td>{project.customer || "-"}</td>

                      <td>
                        <span className="badge badge-info">
                          {project.status}
                        </span>
                      </td>

                      <td>
                        {(() => {
                          if (project.managerId == null) return "미배정";
                          const manager = findEmployee(employees, project.managerId);
                          if (!manager) return `ID: ${project.managerId}`;
                          if (!canLeadProject(manager)) return `직급 미달 담당자 (${manager.name})`;
                          return manager.name;
                        })()}
                      </td>

                      <td>
                        {project.endDate || "미정"}
                        {isOverdue(project) && (
                          <span className="nexus-overdue" aria-label="기간 초과">
                            기간 초과
                          </span>
                        )}
                      </td>

                      <td>
                        {getProgress(project.progress)}%
                      </td>

                      <td>
                        <div className="nexus-project-actions">

                          {/* 상세정보 버튼 */}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setPage("detail");
                            }}
                          >
                            상세보기
                          </button>

                          {/* 담당자 배정 */}
                          {(project.status === "예정" || (project.status === "진행중" && isUnderRankManager(project))) && (
                            <button className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() =>
                                navigate("/admin/assignments")
                              }
                            >
                              담당자 배정
                            </button>
                          )}

                          {/* 삭제 */}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              deleteProject(project.id)
                            }
                          >
                            삭제
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredProjects.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        등록된 프로젝트가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          </div>
        </>

      ) : page === "detail" ? (
        <ProjectDetail
          key={selectedProjectId}
          project={selectedProject}
          manager={selectedManager}
          pendingRequest={selectedProject ? pendingFor(selectedProject.id) : undefined}
          busy={requestBusy}
          onApprove={approveRequest}
          onClose={closeDetail}
          setProjects={setProjects}
        />
      ) : (

        /* ============================= */
        /* 3. 신규 프로젝트 등록 화면 */
        /* ============================= */

        <ProjectRegisterForm
          form={form}
          onChange={handleChange}
          onSubmit={registerProject}
          onBack={() => setPage("list")}
        />
      )}

    </div>
  );
}

export default ProjectManagement;

