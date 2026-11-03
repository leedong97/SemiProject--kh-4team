// 신규 프로젝트 등록 폼 (입력값과 검사는 부모 화면에서 처리)
function ProjectRegisterForm({ form, onChange, onSubmit, onBack }) {
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
  
            <label>고객사 *</label>
            <input
              name="customer"
              className="nexus-project-input"
              placeholder="예: KB국민은행"
              value={form.customer}
              onChange={onChange}
              required
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
                  value={form.startDate}
                  onChange={onChange}
                />
              </div>
  
              <div>
                <label>종료 예정일</label>
                <input
                  type="date"
                  name="endDate"
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
  
            <label>프로젝트 설명</label>
            <textarea
              name="description"
              placeholder="구축 목표, 주요 기능 및 범위"
              value={form.description}
              onChange={onChange}
            />
  
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
              담당자 배정 대기로 등록
            </button>
  
          </div>
  
        </form>
      </>
    );
  }
  
  export default ProjectRegisterForm;