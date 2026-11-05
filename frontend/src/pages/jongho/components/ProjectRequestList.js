import { useState } from "react";

// 프로젝트 요청 목록 (등록 요청 / 완료 요청)
// 행을 펼쳐 본 상태는 이 컴포넌트 안에서만 씁니다.
function ProjectRequestList({ requests, busy, onOpenProject, onApprove, onReject }) {
  const [openIds, setOpenIds] = useState([]);
  // 반려 사유를 입력 중인 요청 ID와 입력값
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const startReject = (id) => {
    setRejectId(id);
    setRejectReason("");
    setRejectError("");
  };

  const cancelReject = () => {
    setRejectId(null);
    setRejectReason("");
    setRejectError("");
  };

  const confirmReject = async (req) => {
    if (!rejectReason.trim()) {
      setRejectError("반려 사유를 입력해 주세요.");
      return;
    }
    await onReject(req, rejectReason.trim());
    cancelReject();
  };

  const toggle = (id) =>
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <section className="nexus-request-list">
      <header className="nexus-request-head">
        <div>
          <strong>프로젝트 요청</strong>
          <p>승인하면 프로젝트 목록에 등록되거나 완료 처리됩니다.</p>
        </div>
        <span className="nexus-request-count">대기 {requests.length}건</span>
      </header>

      {requests.map((req) => {
        const isRegister = req.type === "등록";
        const isOpen = openIds.includes(req.id);

        return (
          <article key={req.id} className={`nexus-request-row${isOpen ? " is-open" : ""}`}>
            <div className="nexus-request-main">
              <div className="nexus-request-info">
                <div className="nexus-request-title">
                  <span className={`badge ${isRegister ? "badge-info" : "badge-done"}`}>
                    {isRegister ? "등록 요청" : "완료 요청"}
                  </span>
                  <strong>{req.projectName || req.title}</strong>
                </div>
                <small className="nexus-request-meta">
                  {req.requesterName || "요청자 미상"} · {req.requestedAt}
                </small>
              </div>

              <div className="nexus-request-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(req.id)}>
                  {isOpen ? "접기" : "상세보기"}
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onApprove(req)}>
                  승인
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => startReject(req.id)}
                >
                  반려
                </button>
              </div>
            </div>

            {rejectId === req.id && (
              <div className="nexus-reject-box">
                <label htmlFor={`reject-${req.id}`}>반려 사유</label>
                <textarea
                  id={`reject-${req.id}`}
                  rows={3}
                  placeholder="예: 기간이 맞지 않습니다. 날짜를 다시 확인해 주세요."
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setRejectError("");
                  }}
                  autoFocus
                />
                {rejectError && <p className="nexus-reject-error">{rejectError}</p>}
                <div className="nexus-reject-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={cancelReject}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={busy}
                    onClick={() => confirmReject(req)}
                  >
                    반려 확정
                  </button>
                </div>
              </div>
            )}

            {isOpen && (
              <div className="nexus-request-detail">
                <div className="nexus-request-facts">
                  <div>
                    <span>기간</span>
                    <strong>{req.startDate || "미정"} ~ {req.endDate || "미정"}</strong>
                  </div>
                  <div>
                    <span>요청 상태</span>
                    <strong>{req.projectStatus || "예정"}</strong>
                  </div>
                  <div>
                    <span>우선순위</span>
                    <strong>{req.priority || "보통"}</strong>
                  </div>
                  {req.reason && (
                    <div>
                      <span>사유</span>
                      <strong>{req.reason}</strong>
                    </div>
                  )}
                </div>

                <div className="nexus-request-content">
                  <span>내용</span>
                  <p>{req.content || "-"}</p>
                </div>

                {!isRegister && req.projectId && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpenProject(req.projectId)}>
                    프로젝트 보기 →
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}

export default ProjectRequestList;