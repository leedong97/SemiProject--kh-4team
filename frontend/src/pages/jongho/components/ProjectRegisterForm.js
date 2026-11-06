import { canLeadProject } from "../shared/permissions";

// 신규 프로젝트 등록 폼 (입력값과 검사는 부모 화면에서 처리)
// 담당자(팀장 이상 1명)와 팀원(재직자 여러 명)을 등록할 때 함께 정합니다.
function ProjectRegisterForm({ form, onChange, onSubmit, onBack, employees = [], customers = [], onAddMember, onRemoveMember }) {
    const activeEmployees = employees.filter((e) => e.status === "재직");
    const leaderCandidates = activeEmployees.filter((e) => canLeadProject(e));
    const selectedMembers = activeEmployees.filter(
        (e) => form.memberIds.includes(e.id) && String(e.id) !== String(form.managerId)
    );
    // 아직 추가하지 않은 직원만 선택지에 보인다 (담당자도 팀원에 포함되므로 같이 제외)
    const addableEmployees = activeEmployees.filter(
        (e) => !form.memberIds.includes(e.id) && String(e.id) !== String(form.managerId)
    );

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
                    <select
                        name="customer"
                        className="nexus-project-input"
                        value={form.customer}
                        onChange={onChange}
                        required
                    >
                        <option value="">고객사를 선택하세요</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

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
                    <select
                        className="nexus-project-input"
                        value=""
                        onChange={(e) => e.target.value && onAddMember(Number(e.target.value))}
                    >
                        <option value="">팀원을 선택하면 추가됩니다</option>
                        {addableEmployees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                                {employee.name} ({employee.rank} · {employee.position})
                            </option>
                        ))}
                    </select>

                    <div style={{ marginTop: "10px" }}>
                        {selectedMembers.length === 0 && <p>아직 추가된 팀원이 없습니다.</p>}
                        {selectedMembers.map((employee) => (
                            <span key={employee.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', border: '1px solid #ccc', borderRadius: '14px', margin: '0 6px 6px 0' }}>
                                {employee.name} ({employee.rank})
                                <button type="button" onClick={() => onRemoveMember(employee.id)}>×</button>
                            </span>
                        ))}
                    </div>
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
