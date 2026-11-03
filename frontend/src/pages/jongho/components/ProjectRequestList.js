import { useState } from "react";

// 프로젝트 요청 목록 (등록 요청 / 완료 요청)
// 행을 펼쳐 본 상태는 이 컴포넌트 안에서만 씁니다.
function ProjectRequestList({ requests, busy, onOpenProject, onApprove, onReject }) {
  const [openIds, setOpenIds] = useState([]);

  const toggle = (id) =>
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="nexus-request-list">
      <div className="nexus-request-head">
        <strong>프로젝트 요청</strong>
        <span>대기 {requests.length}건</span>
      </div>
      {requests.map((req) => {
        const isRegister = req.type === "등록";
        const isOpen = openIds.includes(req.id);
        return (
          <div key={req.id} className="nexus-request-row" style={{ display: "block" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <span className="badge badge-info">
                  {isRegister ? "등록 요청" : "완료 요청"}
                </span>{" "}
                <strong>{req.projectName || req.title}</strong>
                <small> {req.requesterName || "요청자 미상"} · {req.requestedAt}</small>
              </div>
              <div className="nexus-detail-request-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => toggle(req.id)}
                >
                  {isOpen ? "접기" : "상세보기"}
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onApprove(req)}>
                  승인
                </button>
                <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => onReject(req)}>
                  반려
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="nexus-request-detail" style={{ marginTop: 8, fontSize: "0.92em" }}>
                <p><b>내용</b></p>
                <p style={{ whiteSpace: "pre-wrap" }}>{req.content || "-"}</p>
                <p><b>기간</b> {req.startDate || "미정"} ~ {req.endDate || "미정"}</p>
                <p><b>요청 상태</b> {req.projectStatus || "예정"} · <b>우선순위</b> {req.priority || "보통"}</p>
                {req.reason && <p><b>사유</b> {req.reason}</p>}
                {!isRegister && req.projectId && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpenProject(req.projectId)}>
                    프로젝트 보기
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProjectRequestList;