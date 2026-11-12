import { Fragment, useState } from "react";

// 쇼핑 고객이 보낸 프로젝트 견적 목록. 상태를 바꾸고, 요구사항은 펼쳐서 본다.
const STATUS_OPTIONS = ["접수", "검토중", "처리완료"];

// 전화번호 표시: 01012345678 → 010-1234-5678 (저장된 값은 그대로 두고 보여줄 때만 바꾼다)
function formatPhone(phone) {
  if (!phone) return "-";
  const digits = String(phone).replace(/\D/g, "");
  const match = digits.match(/^(\d{3})(\d{3,4})(\d{4})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : phone;
}

export default function QuoteRequestList({ quotes, busy, onChangeStatus, onCreateProject }) {
  const [openIds, setOpenIds] = useState([]);

  const toggle = (id) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (quotes.length === 0) {
    return (
      <div className="card nexus-project-panel nexus-quote-card">
        <div className="nexus-quote-head">
          <strong>견적 요청</strong>
          <span className="nexus-request-count">0건</span>
        </div>
        <p className="nexus-quote-empty">해당 상태의 견적 요청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="card nexus-project-panel nexus-quote-card">
      <div className="nexus-quote-head">
        <strong>견적 요청</strong>
        <span className="nexus-request-count">{quotes.length}건</span>
      </div>
      <table className="nexus-quote-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>기업명</th>
            <th>서비스</th>
            <th>신청자</th>
            <th>이메일</th>
            <th>전화번호</th>
            <th>예산</th>
            <th>신청일</th>
            <th>상태</th>
            <th>요구사항</th>
          </tr>
        </thead>
        <tbody>
        {quotes.map((q, index) => {
            const open = openIds.includes(q.id);
            return (
              <Fragment key={q.id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{q.company}</td>
                  <td>{q.service}</td>
                  <td>{q.applicantName || "-"}</td>
                  <td>{q.email}</td>
                  <td>{formatPhone(q.phone)}</td>
                  <td>{q.budget || "-"}</td>
                  <td>{q.createdAt}</td>
                  <td>
                    <select
                      className="nexus-quote-status"
                      value={q.status}
                      disabled={busy}
                      aria-label={`견적 ${q.id} 상태`}
                      onChange={(e) => onChangeStatus(q.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(q.id)}>
                      {open ? "접기" : "보기"}
                    </button>
                  </td>
                </tr>
                {open && (
                  <tr className="boards-detail-row">
                    <td colSpan="10">
                      <div className="nexus-quote-detail">
                        <div className="nexus-quote-requirements">{q.requirements}</div>
                        <div className="nexus-quote-contact">
                          <span>신청자: {q.applicantName || "-"}</span>
                          <span>이메일: {q.email || "-"}</span>
                          <span>전화번호: {formatPhone(q.phone)}</span>
                          <span>예산 범위: {q.budget || "-"}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onCreateProject(q)}
                        >
                          이 견적으로 프로젝트 등록
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
  );
}
