
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProjectManagement.css";

function ProjectManagement({
  projects = [],
  setProjects,
  employees = []
}) {

  const navigate = useNavigate();

  // 현재 화면: list(목록), register(등록), detail(상세정보)
  const [page, setPage] = useState("list");

  // 프로젝트 검색어
  const [search, setSearch] = useState("");

  // 상세정보를 볼 프로젝트 ID
  const [selectedProjectId, setSelectedProjectId] = useState(null);

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
  const registerProject = (e) => {
    e.preventDefault();

    if (!form.customer.trim() || !form.name.trim()) {
      alert("고객사와 프로젝트명을 입력하세요.");
      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.startDate > form.endDate
    ) {
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
      status: "배정 대기",
      progress: 0,
      plannedProgress: 0,
      managerId: null
    };

    setProjects((prev) => [...prev, newProject]);

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
  const deleteProject = (id) => {
    if (!window.confirm("프로젝트를 삭제하시겠습니까?")) {
      return;
    }

    setProjects((prev) =>
      prev.filter((project) => project.id !== id)
    );
  };

  // 프로젝트 검색
  const filteredProjects = projects.filter((project) => {
    const keyword = search.toLowerCase();

    return (
      (project.name || "").toLowerCase().includes(keyword) ||
      (project.customer || "").toLowerCase().includes(keyword)
    );
  });

  // 상세정보 열기
  const openDetail = (id) => {
    setSelectedProjectId(id);
    setPage("detail");
  };

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
  const selectedManager = employees.find(
    (employee) =>
      String(employee.id) ===
      String(selectedProject?.managerId)
  );

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
              className="nexus-project-primary"
              onClick={() => setPage("register")}
            >
              + 신규 프로젝트 등록
            </button>
          </div>

          <div className="nexus-project-panel">

            <input
              className="nexus-project-input"
              placeholder="프로젝트명 또는 고객사 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="nexus-project-table-wrap">
              <table className="nexus-project-table">

                <thead>
                  <tr>
                    <th>프로젝트명</th>
                    <th>고객사</th>
                    <th>상태</th>
                    <th>진행률</th>
                    <th>관리</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id}>

                      <td>{project.name}</td>

                      <td>{project.customer || "-"}</td>

                      <td>
                        <span className="nexus-project-status">
                          {project.status}
                        </span>
                      </td>

                      <td>
                        {getProgress(project.progress)}%
                      </td>

                      <td>
                        <div className="nexus-project-actions">

                          {/* 상세정보 버튼 */}
                          <button
                            type="button"
                            className="nexus-project-detail-btn"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setPage("detail");
                            }}
                          >
                            상세보기
                          </button>

                          {/* 담당자 배정 */}
                          {project.status === "배정 대기" && (
                            <button
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
                            className="nexus-project-danger"
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
                      <td colSpan="5">
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

            <button
              type="button"
              onClick={closeDetail}
            >
              ← 목록으로
            </button>
          </div>

          {selectedProject ? (
            <div className="nexus-project-panel nexus-detail-panel">

              <div className="nexus-detail-title">
                <h3>{selectedProject.name}</h3>

                <span className="nexus-project-status">
                  {selectedProject.status}
                </span>
              </div>

              <h3 className="nexus-detail-section-title">
                기본 정보
              </h3>

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
                      ).toLocaleString()}만원`
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
            <div className="nexus-project-panel">
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

            <button
              type="button"
              onClick={() => setPage("list")}
            >
              ← 목록
            </button>
          </div>

          <form onSubmit={registerProject}>

            <div className="nexus-project-panel">

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

              <label>예상 계약 금액 (만원)</label>
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

              <button
                type="button"
                onClick={() => setPage("list")}
              >
                취소
              </button>

              <button
                type="submit"
                className="nexus-project-primary"
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
