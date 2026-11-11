import { useState } from "react";
import { adminRequest } from "../adminApi";
import { PROJECT_STATUS_OPTIONS, DEFAULT_PROJECT_STATUS } from "../shared/projectConstants";
import { getProgress, isInvalidDateRange } from "../utils/projectHelpers";
import CustomerPicker from "./CustomerPicker";

// 진행률 입력: 스크롤바(슬라이더)와 숫자 입력칸이 같은 값을 보여준다
function ProgressField({ label, value, step, onChange }) {
  const number = Number(value);
  const sliderValue = value === "" || !Number.isFinite(number) ? 0 : Math.min(100, Math.max(0, number));

  return (
    <div className="nexus-progress-field">
      <span className="nexus-progress-label">{label}</span>
      <div className="nexus-progress-control">
        <input
          type="range"
          min="0"
          max="100"
          step={step}
          value={sliderValue}
          aria-label={`${label} 스크롤바`}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="number"
          min="0"
          max="100"
          step={step}
          value={value}
          aria-label={`${label} 숫자`}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="nexus-progress-unit">%</span>
      </div>
    </div>
  );
}

// 프로젝트 상세정보 화면: 기본 정보 보기, 정보 수정, 완료 요청 승인
function ProjectDetail({ project, manager, pendingRequest, busy, onApprove, onClose, setProjects, customers = [] }) {
  const selectedProject = project;
  const selectedManager = manager;

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // 상세 기본 정보 항목 (라벨, 표시 값)
  const detailInfoItems = selectedProject
    ? [
        ["프로젝트 ID", selectedProject.id],
        ["고객사", selectedProject.customer || "미입력"],
        ["시작 예정일", selectedProject.startDate || "미정"],
        ["종료 예정일", selectedProject.endDate || "미정"],
        [
          "예상 계약 금액",
          selectedProject.budget != null && selectedProject.budget !== ""
            ? `${Number(selectedProject.budget).toLocaleString()}원`
            : "미입력"
        ],
        [
          "담당자",
          selectedProject.managerId == null
            ? "미배정"
            : selectedManager
              ? `${selectedManager.name} (${selectedManager.role})`
              : `담당자 ID: ${selectedProject.managerId}`
        ]
      ]
    : [];

  // 진행률 막대 하나 (실제/계획 공통)
  const renderProgress = (label, value, kind) => (
    <>
      <div className="nexus-detail-progress-label">
        <span>{label}</span>
        <strong>{getProgress(value)}%</strong>
      </div>
      <div className="nexus-detail-track">
        <div className={`nexus-detail-fill ${kind}`} style={{ "--progress-width": `${getProgress(value)}%` }} />
      </div>
    </>
  );

  return (

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
          onClick={onClose}
        >
          ← 목록으로
        </button>
      </div>

      {selectedProject ? (
        <div className="card nexus-project-panel nexus-detail-panel">

          {(() => {
            const req = pendingRequest;
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
                  <button type="button" className="btn btn-primary" disabled={busy} onClick={() => onApprove(req)}>
                    완료 승인
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
                  고객사
                  <CustomerPicker
                    id="project-customer-edit"
                    value={editForm.customer}
                    customers={customers}
                    onChange={(value) => setEditForm((prev) => ({ ...prev, customer: value }))}
                    placeholder="고객사를 검색하거나 직접 입력하세요"
                  />
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

                <ProgressField
                  label="실제 진행률"
                  value={editForm.progress}
                  step="1"
                  onChange={(value) => setEditForm((prev) => ({ ...prev, progress: value }))}
                />

                <ProgressField
                  label="계획 진행률"
                  value={editForm.plannedProgress}
                  step="0.01"
                  onChange={(value) => setEditForm((prev) => ({ ...prev, plannedProgress: value }))}
                />

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
              <button type="button" className="nexus-detail-edit-btn" onClick={startEdit}>
                정보 수정
              </button>
            </div>
          )}

          <div className="nexus-detail-info">
            {detailInfoItems.map(([label, value]) => (
              <div key={label}>
                <label>{label}</label>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="nexus-detail-section">

            <h3>프로젝트 진행 현황</h3>

            {renderProgress("실제 진행률", selectedProject.progress, "actual")}
            {renderProgress("계획 진행률", selectedProject.plannedProgress, "planned")}

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
  );
}

export default ProjectDetail;
