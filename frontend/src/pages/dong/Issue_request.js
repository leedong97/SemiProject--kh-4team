import { useState } from "react";
import { useNavigate } from "react-router-dom";

function IssueRequest({ projects, setIssues }) {

    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState("");
    const [newIssue, setNewIssue] = useState("");
    const [description, setDescription] = useState("");
    const [reporter, setReporter] = useState("");
    const [reporterCode, setReporterCode] = useState("");
    const [priority, setPriority] = useState("보통");

    const handleAddIssue = () => {
        if (selectedProject === "") {
            alert("프로젝트를 선택해주세요.");
            return;
        }

        if (newIssue.trim() === "") {
            alert("이슈 제목을 입력해주세요.");
            return;
        }

        if (description.trim() === "") {
            alert("이슈 내용을 입력해주세요.");
            return;
        }

        if (reporter.trim() === "") {
            alert("이슈 건의자 이름을 입력해주세요.");
            return;
        }
        if (reporterCode.trim() === "") {
            alert("건의자 사원코드를 입력해주세요.");
            return;
        }

        const project = projects.find(
            (item) => String(item.id) === selectedProject
        );

        const issue = {
            id: Date.now(),
            projectId: Number(selectedProject),
            projectName: project?.name || "-",
            customerName: project?.customerName || "-",
            title: newIssue.trim(),
            description: description.trim(),
            reporterName: reporter.trim(),
            priority: priority,
            status: "진행중",
            createdAt: new Date().toLocaleDateString("sv-SE")
        };

        setIssues((previousIssues) => [...previousIssues, issue]);
        navigate(`/issue/${issue.id}`);
    };



        return (
        <main className="issue-page">
            <section className="issue-register">
                <h3>새로운 이슈 등록</h3>

                <div className="issue-register-form">
                      {/* 이슈 건의자 사원코드 */}
                      <input
                        type="text"
                        placeholder="건의자 사원코드 (예: EMP-001)"
                        value={reporterCode}
                        onChange={(e) => setReporterCode(e.target.value)}
                    />
                    {/* 이슈 건의자 */}
                    <input
                        type="text"
                        placeholder="이슈 건의자 이름"
                        value={reporter}
                        onChange={(e) => setReporter(e.target.value)}
                    />
                    {/* 프로젝트 선택 */}
                    <select
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
                  

                    <button onClick={handleAddIssue}>
                        이슈 요청
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
