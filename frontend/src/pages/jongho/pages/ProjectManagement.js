import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { adminRequest } from "../adminApi";
import { matchesProjectSearch } from "../utils/projectFilters";
import usePagination from "../utils/usePagination";
import Pager from "../components/Pager";
import { DEFAULT_PROJECT_STATUS, PROJECT_STATUS } from "../shared/projectConstants";
import ProjectRequestList from "../components/ProjectRequestList";
import ProjectRegisterForm from "../components/ProjectRegisterForm";
import ProjectDetail from "../components/ProjectDetail";
import ProjectTable from "../components/ProjectTable";
import FilterChips from "../components/FilterChips";
import SearchSortBar from "../components/SearchSortBar";
import { isInvalidDateRange } from "../utils/projectHelpers";
import { findEmployee } from "../shared/employees";
import { compareText, compareNumber, compareDate, descending, sortByOption } from "../utils/listSort";

const PROJECT_PAGE_SIZE = 10;

// 정렬 선택지 (인원 관리 화면과 같은 드롭다운 방식)
const SORT_OPTIONS = [
  { value: "default", label: "기본순" },
  { value: "name", label: "프로젝트명순" },
  { value: "customer", label: "고객사순" },
  { value: "status", label: "상태순" },
  { value: "manager", label: "담당자순" },
  { value: "endDate", label: "종료일 빠른순" },
  { value: "progress", label: "진행률 높은순" },
];
function ProjectManagement({
  projects = [],
  setProjects,
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
  // 정렬 선택 (드롭다운)
  const [sortOption, setSortOption] = useState("default");

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
    description: "",
    managerId: "",
    memberIds: []
  });

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 팀원 추가 / 제거 (셀렉트로 추가, 칩의 × 로 제거)
  const addMember = (employeeId) => {
    setForm((prev) => (
      prev.memberIds.includes(employeeId)
        ? prev
        : { ...prev, memberIds: [...prev.memberIds, employeeId] }
    ));
  };

  const removeMember = (employeeId) => {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.filter((id) => id !== employeeId)
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
      status: form.managerId ? PROJECT_STATUS.IN_PROGRESS : DEFAULT_PROJECT_STATUS,
      progress: 0,
      plannedProgress: 0,
      managerId: form.managerId ? Number(form.managerId) : null,
      memberIds: form.memberIds.filter((id) => String(id) !== String(form.managerId))
    };

    try {
      await createProject(newProject);
    } catch (error) {
      alert('DB 등록 실패: ' + error.message);
      return;
    }

    alert("프로젝트가 등록되었습니다.");

    setForm({
      customer: "",
      name: "",
      startDate: "",
      endDate: "",
      budget: "",
      description: "",
      managerId: "",
      memberIds: []
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
    if (!project.endDate || project.status === PROJECT_STATUS.DONE) return false;
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
  // 선택한 항목 기준 정렬 (기본순은 원래 목록 순서 그대로)
  const sortRules = {
    name: (a, b) => compareText(getSortValue(a, "name"), getSortValue(b, "name")),
    customer: (a, b) => compareText(getSortValue(a, "customer"), getSortValue(b, "customer")),
    status: (a, b) => compareText(getSortValue(a, "status"), getSortValue(b, "status")),
    manager: (a, b) => compareText(getSortValue(a, "manager"), getSortValue(b, "manager")),
    // 종료일이 없는 프로젝트는 맨 뒤로
    endDate: (a, b) => compareDate(a.endDate, b.endDate),
    progress: descending((a, b) => compareNumber(a.progress, b.progress)),
  };
  const sortedProjects = sortByOption(filteredProjects, sortOption, sortRules);

  // 페이지 나누기 (한 페이지 15개, 검색·필터·정렬이 바뀌면 1페이지로)
  const { pageItems: pagedProjects, currentPage, totalPages, total, goPrev, goNext } =
    usePagination(sortedProjects, PROJECT_PAGE_SIZE, [search, overdueOnly, sortOption]);



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

  // 고객사 목록 (등록·수정 때 선택지로 쓴다)
  const [customers, setCustomers] = useState([]);
  useEffect(() => {
    adminRequest("/customers")
      .then((rows) => setCustomers(Array.isArray(rows) ? rows : []))
      .catch(() => setCustomers([]));
  }, []);

  // 완료 요청 목록: 상태가 '완료 요청'인 프로젝트를 요청 형태로 바꿔서 보여준다
  const loadPendingRequests = async () => {
    try {
      const rows = await adminRequest("/projects");
      const list = Array.isArray(rows) ? rows : [];
      setPendingRequests(
        list
          .filter((p) => p.status === PROJECT_STATUS.REQUESTED)
          .map((p) => ({
            id: "status-" + p.id,
            type: "완료",
            source: "status",
            projectId: p.id,
            projectName: p.name,
            title: p.name,
            requesterName: p.customer || "",
            requestedAt: ""
          }))
      );
    } catch (err) {
      setPendingRequests([]);
    }
  };

  // 선택한 프로젝트에 대기 중인 요청 찾기
  const pendingFor = (projectId) =>
    pendingRequests.find((req) => String(req.projectId) === String(projectId));

  // 완료 요청 승인: 프로젝트 상태를 '완료'로 바꾸고, 화면 상태도 맞춤
  const approveRequest = async (req) => {
    const name = req.projectName || req.title;
    if (!window.confirm(`"${name}" 프로젝트를 완료 처리할까요?`)) return;
    setRequestBusy(true);
    try {
      await adminRequest(`/projects/${req.projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: PROJECT_STATUS.DONE, progress: 100 })
      });
      setProjects((prev) =>
        prev.map((p) =>
          String(p.id) === String(req.projectId) ? { ...p, status: PROJECT_STATUS.DONE, progress: 100 } : p
        )
      );
      await loadPendingRequests();
      alert("프로젝트를 완료 처리했습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setRequestBusy(false);
    }
  };

  // 완료 요청 반려: 상태를 '진행중'으로 되돌린다 (반려 사유는 화면에서 알림으로만 확인)
  const rejectRequest = async (req, reason) => {
    setRequestBusy(true);
    try {
      await adminRequest(`/projects/${req.projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: PROJECT_STATUS.IN_PROGRESS })
      });
      setProjects((prev) =>
        prev.map((p) => (String(p.id) === String(req.projectId) ? { ...p, status: PROJECT_STATUS.IN_PROGRESS } : p))
      );
      alert(`완료 요청을 반려했습니다. (사유: ${reason})`);
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

            <SearchSortBar
              searchId="project-search"
              placeholder="프로젝트명 또는 고객사 검색"
              search={search}
              onSearchChange={setSearch}
              selects={[
                { id: "project-sort", label: "정렬 기준", value: sortOption, onChange: setSortOption, options: SORT_OPTIONS },
              ]}
            />
            <FilterChips
              label="기간 필터"
              value={overdueOnly}
              onChange={setOverdueOnly}
              options={[
                { value: false, label: "전체" },
                { value: true, label: `기간 초과 (${overdueCount})` },
              ]}
            />

            {pendingRequests.length > 0 && (
              <ProjectRequestList
                requests={pendingRequests}
                busy={requestBusy}
                onOpenProject={openDetail}
                onApprove={approveRequest}
                onReject={rejectRequest}
              />
            )}

            <ProjectTable
              startIndex={(currentPage - 1) * PROJECT_PAGE_SIZE}
              projects={pagedProjects}
              employees={employees}
              isEmpty={filteredProjects.length === 0}
              isOverdue={isOverdue}
              onOpenProject={openDetail}
              onManageMembers={() => navigate("/admin/members")}
              onDeleteProject={deleteProject}
            />

            <Pager currentPage={currentPage} totalPages={totalPages} total={total}
              onPrev={goPrev} onNext={goNext} />
          </div>
        </>

      ) : page === "detail" ? (
        <ProjectDetail
          key={selectedProjectId}
          customers={customers}
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
          customers={customers}
          form={form}
          onChange={handleChange}
          onSubmit={registerProject}
          onBack={() => setPage("list")}
          employees={employees}
          onAddMember={addMember}
          onRemoveMember={removeMember}
        />
      )}

    </div>
  );
}

export default ProjectManagement;