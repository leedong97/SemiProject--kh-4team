import { canLeadProject } from "../shared/permissions";
import EmployeePicker from "./EmployeePicker";
import CustomerPicker from "./CustomerPicker";

// 신규 프로젝트 등록 폼 (입력값과 검사는 부모 화면에서 처리)
// 담당자(팀장 이상 1명)와 팀원(재직자 여러 명)을 등록할 때 함께 정합니다.
const todayString = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function ProjectRegisterForm({ form, sourceQuote, onChange, onCustomerChange, onSubmit, onBack, employees = [], customers = [], onAddMember, onRemoveMember }) {
    const activeEmployees = employees.filter((e) => e.status === "재직");
    const leaderCandidates = activeEmployees.filter((e) => canLeadProject(e));
    return (
      <>
        <div className="nexus-project-heading">
          <div>
            <p>관리자 / 프로젝트 관리 / 신규 등록</p>
            <h2>신규 프로젝트 등록</h2>
          </div>

          <button className="btn btn-outline"
            type="button"
            onClick={onBack}
          >
            ← 목록
          </button>
        </div>

        <form onSubmit={onSubmit}>

          <div className="card nexus-project-panel">

            <h3>기본 정보</h3>

            {sourceQuote && (
              <div className="nexus-project-quote-source">
                <strong>견적 요청 #{sourceQuote.id} 정보</strong>
                <div>
                  <span>신청자: {sourceQuote.applicantName || "-"}</span>
                  <span>이메일: {sourceQuote.email || "-"}</span>
                  <span>전화번호: {sourceQuote.phone || "-"}</span>
                  <span>요청 예산 범위: {sourceQuote.budget || "-"}</span>
                </div>
                <div className="nexus-project-quote-request">
                  <strong>고객 요청사항 원문</strong>
                  <p>{sourceQuote.requirements || "요청사항이 없습니다."}</p>
                </div>
                <small>예산 범위는 참고용입니다. 계약 금액은 아래에 숫자로 입력하세요.</small>
              </div>
            )}

            <label>고객사 *</label>
            <CustomerPicker
              id="project-customer"
              value={form.customer}
              customers={customers}
              onChange={onCustomerChange}
              placeholder="고객사를 검색하거나 직접 입력하세요"
            />

            <label>프로젝트명 *</label>
            <input
              name="name"
              className="nexus-project-input"
              placeholder="예: 고객정보 통합관리 시스템"
              value={form.name}
              onChange={onChange}
              required
            />

            <div className="nexus-project-date-row">

              <div>
                <label>시작 예정일</label>
                <input
                  type="date"
                  name="startDate"
                  min={todayString()}
                  value={form.startDate}
                  onChange={onChange}
                />
              </div>

              <div>
                <label>종료 예정일</label>
                <input
                  type="date"
                  name="endDate"
                  min={form.startDate || todayString()}
                  value={form.endDate}
                  onChange={onChange}
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
              onChange={onChange}
            />

            <label>프로젝트 설명 *</label>
            <textarea
              name="description"
              placeholder="구축 목표, 주요 기능 및 범위"
              value={form.description}
              onChange={onChange}
              required
            />

          </div>

          <div className="card nexus-project-panel">

            <h3>담당자 · 팀원</h3>

            <label>담당자 (팀장 이상)</label>
            <select
              name="managerId"
              className="nexus-project-input"
              value={form.managerId}
              onChange={onChange}
            >
              <option value="">담당자 나중에 배정</option>
              {leaderCandidates.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} ({employee.rank} · {employee.position})
                </option>
              ))}
            </select>

            <label>팀원 추가</label>
            <EmployeePicker
              employees={employees}
              selectedIds={form.memberIds}
              excludedId={form.managerId}
              selectClassName="nexus-project-input"
              emptyMessage="아직 추가된 팀원이 없습니다."
              onAdd={onAddMember}
              onRemove={onRemoveMember}
            />
            <small>담당자로 고른 직원은 팀원 명단에도 자동으로 포함됩니다.</small>

          </div>

          <div className="nexus-project-footer">

            <button className="btn btn-outline"
              type="button"
              onClick={onBack}
            >
              취소
            </button>

            <button
              type="submit"
              className="btn btn-primary"
            >
              프로젝트 등록
            </button>

          </div>

        </form>
      </>
    );
  }

  export default ProjectRegisterForm;
