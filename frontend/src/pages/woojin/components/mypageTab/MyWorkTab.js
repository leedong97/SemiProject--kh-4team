import { Link } from "react-router-dom";

// managedProjects: 내가 "담당자"인 프로젝트 목록. 하나라도 있으면 맨 위에 직원 평가 바로가기를 보여 줘요.
// canEvaluate: 평가 권한(책임자급 직급 또는 인사팀)이 있을 때만 "팀원 평가하러 가기"를 보여 줘요.
function MyWorkTab({ projects, managedProjects = [], canEvaluate = false }) {
    return (
        <section className="mp-panel">
            {managedProjects.length > 0 && (
                <>
                    <h3>내가 담당하는 프로젝트</h3>
                    {managedProjects.map((p) => (
                        <div key={p.id} className="mp-card mp-managed">
                            <div>
                                <p className="mp-item-title">{p.name}</p>
                                <p className="mp-item-sub">담당자 · {p.status}</p>
                            </div>
                            {/* 직원 평가 화면(희승 작성, 관리자 화면 안에 있음)으로 이동 */}
                            {canEvaluate && (
                                <Link to="/admin/evaluations?from=mypage" className="mp-eval-link">
                                    팀원 평가하러 가기
                                </Link>
                            )}
                        </div>
                    ))}
                </>
            )}

            <h3>참여 중인 프로젝트</h3>
            {/* 새로 가입한 직원처럼 참여 프로젝트가 0건이면 빈 안내를 보여 줘요 */}
            {projects.length === 0 && <p className="mp-empty">참여 중인 프로젝트가 없어요.</p>}
            {projects.map((p) => (
                <div key={p.id} className="mp-card">
                    <p className="mp-item-title">{p.name}</p>
                    <p className="mp-item-sub">{p.role}</p>
                    <div className="mp-progress">
                        <div className="mp-bar">
                            <div className="mp-bar-fill" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span>{p.progress}%</span>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default MyWorkTab;
