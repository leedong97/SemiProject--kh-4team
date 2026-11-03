import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { canLeadProject } from "../shared/permissions";
import { adminRequest, getPendingProjectRequests } from "../adminApi";
import { matchesProjectSearch } from "../utils/projectFilters";
import useSortableList from "../utils/useSortableList";
import { PROJECT_STATUS_OPTIONS, DEFAULT_PROJECT_STATUS } from "../shared/projectConstants";

// 담당자 ID로 직원 찾기 (문자열/숫자 ID 차이를 한 곳에서 처리)
const findEmployee = (employees, id) =>
  employees.find((e) => String(e.id) === String(id));

// 시작일이 종료일보다 늦은지 확인
const isInvalidDateRange = (startDate, endDate) =>
  Boolean(startDate && endDate && startDate > endDate);

function ProjectManagement({
  projects = [],
  setProjects,
  createProject,
  updateProject,
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

  // 상세정보를 볼 프로젝트 ID
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // 상세 화면 정보 수정 상태
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // 프로젝트 검색
  const filteredProjects = projects.filter((project) => matchesProjectSearch(project, search));

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
    setEditing(false);
    setEditForm(null);
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
      const rows = await getPendingProjectRequests("완료");
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
    if (!window.confirm(`"${req.projectName}" 프로젝트를 완료 처리할까요?`)) return;
    setRequestBusy(true);
    try {
      await adminRequest(`/project-requests/${req.id}/approve`, { method: "POST" });
      setProjects((prev) =>
        prev.map((p) =>
          String(p.id) === String(req.projectId) ? { ...p, status: "완료", progress: 100 } : p
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

  // 완료 요청 반려: 사유를 입력받아 서버에 저장
  const rejectRequest = async (req) => {
    const reason = window.prompt("반려 사유를 입력하세요.");
    if (!reason || !reason.trim()) return;
    setRequestBusy(true);
    try {
      await adminRequest(`/project-requests/${req.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() })
      });
      await loadPendingRequests();
      alert("완료 요청을 반려했습니다.");
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

  // 정보 수정 시작: 현재 값으로 폼을 채움
  const startEdit = () => {
    if (!selectedProject) return;
    setEditForm({
      name: selectedProject.name || "",
      customer: selectedProject.customer || "",
      description: selectedProject.description || "",
      budget: selectedProject.budget == null ? "" : String(selectedProject.budget),
      startDate: selectedProject.startDate || "",
      endDate: selectedProject.endDate || "",
      status: selectedProject.status || DEFAULT_PROJECT_STATUS,
      progress: String(getProgress(selectedProject.progress)),
      plannedProgress: String(getProgress(selectedProject.plannedProgress))
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm(null);
  };

  // 폼 입력값 변경
  const updateEdit = (key) => (e) =>
    setEditForm((prev) => ({ ...prev, [key]: e.target.value }));

  // 정보 수정 저장: 서버에 보내고 성공하면 화면 상태도 갱신
  const saveEdit = async () => {
    if (!selectedProject || !editForm) return;
    const f = editForm;

    if (!f.name.trim() || !f.customer.trim() || !f.description.trim()) {
      alert("프로젝트명, 고객사, 설명을 입력하세요.");
      return;
    }
    const progress = Number(f.progress);
    if (f.progress.trim() === "" || !Number.isInteger(progress) || progress < 0 || progress > 100) {
      alert("실제 진행률은 0~100 사이의 정수로 입력하세요.");
      return;
    }
    const planned = Number(f.plannedProgress);
    if (f.plannedProgress.trim() === "" || !Number.isFinite(planned) || planned < 0 || planned > 100) {
      alert("계획 진행률은 0~100 사이의 숫자로 입력하세요.");
      return;
    }
    if (isInvalidDateRange(f.startDate, f.endDate)) {
      alert("종료 예정일은 시작 예정일 이후여야 합니다.");
      return;
    }

    const body = {
      name: f.name.trim(),
      customer: f.customer.trim(),
      description: f.description.trim(),
      budget: f.budget === "" ? null : Number(f.budget),
      startDate: f.startDate || null,
      endDate: f.endDate || null,
      status: f.status,
      progress,
      plannedProgress: planned
    };

    setSavingEdit(true);
    try {
      await adminRequest(`/projects/${selectedProject.id}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      setProjects((prev) =>
        prev.map((p) =>
          String(p.id) === String(selectedProject.id) ? { ...p, ...body } : p
        )
      );
      setEditing(false);
      setEditForm(null);
      alert("프로젝트 정보를 저장했습니다.");
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // 진행률을 0~100 사이 숫자로 변환
  const getProgress = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.max(0, Math.min(100, number));
  };

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

            {pendingRequests.length > 0 && (
              <div className="nexus-request-list">
                <div className="nexus-request-head">
                  <strong>완료 요청</strong>
                  <span>대기 {pendingRequests.length}건</span>
                </div>
                {pendingRequests.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    className="nexus-request-row"
                    onClick={() => openDetail(req.projectId)}
                  >
                    <strong>{req.projectName}</strong>
                    <small>{req.requesterName || "요청자 미상"} · {req.requestedAt}</small>
                  </button>
                ))}
              </div>
            )}

            <div className="nexus-project-table-wrap">
              <table className="nexus-project-table">

                <thead>
                  <tr>
                    <th onClick={() => changeSort("name")} style={{ cursor: "pointer" }}>프로젝트명{sortMark("name")}</th>
                    <th onClick={() => changeSort("customer")} style={{ cursor: "pointer" }}>고객사{sortMark("customer")}</th>
                    <th onClick={() => changeSort("status")} style={{ cursor: "pointer" }}>상태{sortMark("status")}</th>
                    <th onClick={() => changeSort("manager")} style={{ cursor: "pointer" }}>담당자{sortMark("manager")}</th>
                    <th onClick={() => changeSort("endDate")} style={{ cursor: "pointer" }}>종료일{sortMark("endDate")}</th>
                    <th onClick={() => changeSort("progress")} style={{ cursor: "pointer" }}>진행률{sortMark("progress")}</th>
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

        /* ============================= */
        /* 2. 프로젝트 상세정보 화면 */
        /* ============================= */

        <>
          <div className="nexus-project-heading">
            <div>
              <p>관리자 / 프로젝트 관리 / 상세정보</p>
              <h2>프로젝트 상세정보</h2>
            </div>

            <button className="btn btn-outline"
              type="button"
              onClick={closeDetail}
            >
              ← 목록으로
            </button>
          </div>

          {selectedProject ? (
            <div className="card nexus-project-panel nexus-detail-panel">

              {(() => {
                const req = pendingFor(selectedProject.id);
                if (!req) return null;
                return (
                  <div className="nexus-detail-request">
                    <div>
                      <strong>완료 요청 대기 중</strong>
                      <p>
                        {req.requesterName || "요청자 미상"} · {req.requestedAt}
                        {req.reason ? ` · ${req.reason}` : ""}
                      </p>
                    </div>
                    <div className="nexus-detail-request-actions">
                      <button type="button" className="btn btn-primary" disabled={requestBusy} onClick={() => approveRequest(req)}>
                        완료 승인
                      </button>
                      <button type="button" className="btn btn-outline" disabled={requestBusy} onClick={() => rejectRequest(req)}>
                        반려
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="nexus-detail-title">
                <h3>{selectedProject.name}</h3>

                <span className="badge badge-info">
                  {selectedProject.status}
                </span>
              </div>

              <h3 className="nexus-detail-section-title">
                기본 정보
              </h3>

              {editing && editForm ? (
                <div className="nexus-detail-section nexus-detail-edit">
                  <h3>프로젝트 정보 수정</h3>

                  <div className="nexus-detail-edit-grid">
                    <label>
                      프로젝트명
                      <input value={editForm.name} onChange={updateEdit("name")} />
                    </label>

                    <label>
                      고객사 (등록된 이름)
                      <input value={editForm.customer} onChange={updateEdit("customer")} />
                    </label>

                    <label>
                      예산 (원)
                      <input type="number" min="0" value={editForm.budget} onChange={updateEdit("budget")} />
                    </label>

                    <label>
                      상태
                      <select value={editForm.status} onChange={updateEdit("status")}>
                        {PROJECT_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      시작 예정일
                      <input type="date" value={editForm.startDate} onChange={updateEdit("startDate")} />
                    </label>

                    <label>
                      종료 예정일
                      <input type="date" value={editForm.endDate} onChange={updateEdit("endDate")} />
                    </label>

                    <label>
                      실제 진행률 (%)
                      <input type="number" min="0" max="100" step="1" value={editForm.progress} onChange={updateEdit("progress")} />
                    </label>

                    <label>
                      계획 진행률 (%)
                      <input type="number" min="0" max="100" step="0.01" value={editForm.plannedProgress} onChange={updateEdit("plannedProgress")} />
                    </label>

                    <label className="nexus-detail-edit-full">
                      설명
                      <textarea rows={4} value={editForm.description} onChange={updateEdit("description")} />
                    </label>
                  </div>

                  <div className="nexus-detail-edit-actions">
                    <button type="button" className="btn btn-ghost" disabled={savingEdit} onClick={cancelEdit}>
                      취소
                    </button>
                    <button type="button" className="btn btn-primary" disabled={savingEdit} onClick={saveEdit}>
                      {savingEdit ? "저장 중..." : "저장"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="nexus-detail-edit-toggle">
                  <button type="button" className="btn btn-ghost" onClick={startEdit}>
                    정보 수정
                  </button>
                </div>
              )}

              <div className="nexus-detail-info">

                <div>
                  <label>프로젝트 ID</label>
                  <strong>{selectedProject.id}</strong>
                </div>

                <div>
                  <label>고객사</label>
                  <strong>
                    {selectedProject.customer || "미입력"}
                  </strong>
                </div>

                <div>
                  <label>시작 예정일</label>
                  <strong>
                    {selectedProject.startDate || "미정"}
                  </strong>
                </div>

                <div>
                  <label>종료 예정일</label>
                  <strong>
                    {selectedProject.endDate || "미정"}
                  </strong>
                </div>

                <div>
                  <label>예상 계약 금액</label>
                  <strong>
                    {selectedProject.budget != null &&
                      selectedProject.budget !== ""
                      ? `${Number(
                        selectedProject.budget
                      ).toLocaleString()}원`
                      : "미입력"}
                  </strong>
                </div>

                <div>
                  <label>담당자</label>
                  <strong>
                    {selectedProject.managerId == null
                      ? "미배정"
                      : selectedManager
                        ? `${selectedManager.name} (${selectedManager.role})`
                        : `담당자 ID: ${selectedProject.managerId}`}
                  </strong>
                </div>

              </div>

              <div className="nexus-detail-section">

                <h3>프로젝트 진행 현황</h3>

                <div className="nexus-detail-progress-label">
                  <span>실제 진행률</span>
                  <strong>
                    {getProgress(selectedProject.progress)}%
                  </strong>
                </div>

                <div className="nexus-detail-track">
                  <div
                    className="nexus-detail-fill actual"
                    style={{
                      width: `${getProgress(
                        selectedProject.progress
                      )}%`
                    }}
                  />
                </div>

<div className="nexus-detail-progress-label">
                  <span>계획 진행률</span>
                  <strong>
                    {getProgress(
                      selectedProject.plannedProgress
                    )}%
                  </strong>
                </div>

                <div className="nexus-detail-track">
                  <div
                    className="nexus-detail-fill planned"
                    style={{
                      width: `${getProgress(
                        selectedProject.plannedProgress
                      )}%`
                    }}
                  />
                </div>

              </div>

              <div className="nexus-detail-section">
                <h3>프로젝트 설명</h3>

                <p className="nexus-detail-description">
                  {selectedProject.description ||
                    "등록된 프로젝트 설명이 없습니다."}
                </p>
              </div>

            </div>
          ) : (
            <div className="card nexus-project-panel">
              <p>프로젝트 정보를 찾을 수 없습니다.</p>
            </div>
          )}
        </>

      ) : (

        /* ============================= */
        /* 3. 신규 프로젝트 등록 화면 */
        /* ============================= */

        <>
          <div className="nexus-project-heading">
            <div>
              <p>관리자 / 프로젝트 관리 / 신규 등록</p>
              <h2>신규 프로젝트 등록</h2>
            </div>

            <button className="btn btn-outline"
              type="button"
              onClick={() => setPage("list")}
            >
              ← 목록
            </button>
          </div>

          <form onSubmit={registerProject}>

            <div className="card nexus-project-panel">

              <h3>기본 정보</h3>

              <label>고객사 *</label>
              <input
                name="customer"
                className="nexus-project-input"
                placeholder="예: KB국민은행"
                value={form.customer}
                onChange={handleChange}
                required
              />

              <label>프로젝트명 *</label>
              <input
                name="name"
                className="nexus-project-input"
                placeholder="예: 고객정보 통합관리 시스템"
                value={form.name}
                onChange={handleChange}
                required
              />

              <div className="nexus-project-date-row">

                <div>
                  <label>시작 예정일</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label>종료 예정일</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </div>

              </div>

              <label>예상 계약 금액 (원)</label>
              <input
                type="number"
                name="budget"
                min="0"
                className="nexus-project-input"
                placeholder="10000"
                value={form.budget}
                onChange={handleChange}
              />

              <label>프로젝트 설명</label>
              <textarea
                name="description"
                placeholder="구축 목표, 주요 기능 및 범위"
                value={form.description}
                onChange={handleChange}
              />

            </div>

            <div className="nexus-project-footer">

              <button className="btn btn-outline"
                type="button"
                onClick={() => setPage("list")}
              >
                취소
              </button>

              <button
                type="submit"
                className="btn btn-primary"
              >
                담당자 배정 대기로 등록
              </button>

            </div>

          </form>
        </>
      )}

    </div>
  );
}

export default ProjectManagement;