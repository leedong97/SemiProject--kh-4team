import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from '../../shared/config';
import getLoginUser from '../woojin/getLoginUser';

function IssueRequest({ setIssues }) {

    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState("");
    const [newIssue, setNewIssue] = useState("");
    const [description, setDescription] = useState("");
    const [user] = useState(() => getLoginUser());
    const hasLoginUser = !user.isDummy && Number.isInteger(Number(user.id)) &&
        Number(user.id) > 0 && Boolean(user.name && user.empNo);
    const reporter = hasLoginUser ? user.name : "";
    const reporterCode = hasLoginUser ? user.empNo : "";
    const [projects, setProjects] = useState([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectError, setProjectError] = useState("");
    const [priority, setPriority] = useState("보통");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!hasLoginUser) {
            setIsLoadingProjects(false);
            return;
        }

        const controller = new AbortController();
        async function loadMyProjects() {
            try {
                const response = await fetch(
                    `${API_BASE}/api/my-projects?employeeId=${encodeURIComponent(user.id)}`,
                    { signal: controller.signal }
                );
                const data = await response.json();
                if (!response.ok || !data.ok || !Array.isArray(data.projects)) {
                    throw new Error(data.message || "참여 프로젝트를 불러오지 못했습니다.");
                }
                if (!controller.signal.aborted) setProjects(data.projects);
            } catch (err) {
                if (!controller.signal.aborted) {
                    setProjectError(err.message || "참여 프로젝트를 불러오지 못했습니다.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoadingProjects(false);
            }
        }
        loadMyProjects();
        return () => controller.abort();
    }, [hasLoginUser, user.id]);

    const canSubmit = hasLoginUser && !isLoadingProjects && !projectError &&
        projects.some((project) => String(project.id) === selectedProject);

    const handleAddIssue = async () => {
        if (isSubmitting || !canSubmit) return;

        if (
            selectedProject === "" ||
            !newIssue.trim() ||
            !description.trim() ||
            !reporter.trim() ||
            !reporterCode.trim()
        ) {
            alert("프로젝트와 모든 필수 입력값을 확인해주세요.");
            return;
        }

        setIsSubmitting(true);

        try {
            // ① 입력 내용을 백엔드로 전송
            const response = await fetch(`${API_BASE}/api/dong/issues`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    projectId: Number(selectedProject),
                    title: newIssue.trim(),
                    description: description.trim(),
                    reporterCode: reporterCode.trim(),
                    reporterName: reporter.trim(),
                    priority
                })
            });

            const data = await response.json();

            // 서버의 검증 실패나 저장 실패 처리
            if (!response.ok) {
                throw new Error(data.message || "이슈 등록에 실패했습니다.");
            }

            // ② DB에 저장된 실제 객체를 화면 상태에 추가
            setIssues((previousIssues) => [...previousIssues, data]);

            // ③ DB에서 생성한 실제 ID로 상세 화면 이동
            navigate(`/issue/${data.id}`);
        } catch (err) {
            alert(err.message || "서버 연결을 확인해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="issue-page">
            <section className="issue-register">
                <h3>새로운 이슈 등록</h3>

                {!hasLoginUser && (
                    <p role="alert">로그인 후 이슈를 건의할 수 있습니다. <button onClick={() => navigate("/login")}>로그인</button></p>
                )}
                {hasLoginUser && isLoadingProjects && <p role="status">참여 프로젝트를 불러오는 중입니다.</p>}
                {projectError && <p role="alert">{projectError}</p>}
                {hasLoginUser && !isLoadingProjects && !projectError && projects.length === 0 && (
                    <p role="status">참여 중인 프로젝트가 없습니다.</p>
                )}

                <div className="issue-register-form">
                    {/* 이슈 건의자 사원코드 */}
                    <input
                        type="text"
                        placeholder="건의자 사원코드 (예: EMP-001)"
                        value={reporterCode}
                        aria-label="건의자 사원코드"
                        readOnly
                    />
                    {/* 이슈 건의자 */}
                    <input
                        type="text"
                        placeholder="이슈 건의자 이름"
                        value={reporter}
                        aria-label="이슈 건의자 이름"
                        readOnly
                    />
                    {/* 프로젝트 선택 */}
                    <select
                        aria-label="참여 프로젝트"
                        disabled={!hasLoginUser || isLoadingProjects || Boolean(projectError) || projects.length === 0}
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                    >
                        <option value="">프로젝트를 선택해주세요</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.id} - {project.name}
                            </option>
                        ))}
                    </select>
                    {/* 이슈 우선도 */}
                    <label htmlFor="issue-priority">이슈 우선도</label>

                    <select
                        id="issue-priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="낮음">낮음</option>
                        <option value="보통">보통</option>
                        <option value="높음">높음</option>
                        <option value="긴급">긴급</option>
                    </select>
                    {/* 이슈 제목 */}
                    <input
                        type="text"
                        placeholder="새 이슈 제목을 입력하세요"
                        value={newIssue}
                        onChange={(e) => setNewIssue(e.target.value)}
                    />

                    {/* 이슈 내용 */}
                    <textarea
                        placeholder="이슈 발생 내용 및 오류 상황을 입력하세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5"
                    />


                    <button onClick={handleAddIssue} disabled={isSubmitting || !canSubmit}>
                        {isSubmitting ? "등록 중..." : "이슈 요청"}
                    </button>

                    <button onClick={() => navigate("/issue")}>
                        목록으로 돌아가기
                    </button>
                </div>
            </section>
        </main>
    );

}

export default IssueRequest;
