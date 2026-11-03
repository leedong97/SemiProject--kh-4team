
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// 수정: projects, issues, setIssues를 App에서 전달받는다.
function Issue({ projects, issues, setIssues }) {

   
    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState("");
    const [search, setSearch] = useState("");
    const handleProjectChange = (e) => {
        setSelectedProject(e.target.value);
        setSearch("");
    };

    const filteredIssues = issues.filter((issue) => {
        const projectMatch =
            selectedProject === "" ||
            issue.projectId === selectedProject;
        const titleMatch =
            issue.title.toLowerCase().includes(search.toLowerCase());
        return projectMatch && titleMatch;
    });

    // 이슈 건의 페이지로 이동
    const handleIssueRequest = () => {
        navigate(`/issue/request`);
    };

    return (
        <main className="issue-page">
            <div className="issue-header">
                <div>
                    <h1>SI 프로젝트 이슈 목록</h1>
                    <p>
                        프로젝트별 이슈를 조회하고 관리할 수 있습니다.
                    </p>
                </div>               
                
                <button className="issue-reset" onClick={handleIssueRequest}>
                 이슈 건의
                </button>
            </div>

            <div className="issue-summary">
                <span>전체 프로젝트 {projects.length}개</span>
                <span>조회된 이슈 {filteredIssues.length}개</span>
            </div>

            <section className="issue-filter">

                <label htmlFor="project-select">
                    프로젝트 선택
                </label>

                <select id="project-select" value={selectedProject} onChange={handleProjectChange}>
                    <option value="">전체 프로젝트</option>
                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.id} - {project.name}
                        </option>
                    ))}
                </select>

                <label htmlFor="issue-search">
                    이슈 제목 검색
                </label>

                <input id="issue-search" type="text" placeholder="이슈 제목 검색" value={search} onChange={(e) => setSearch(e.target.value)} />

                <label htmlFor="issue-search">
                    이슈 건의자 검색
                </label>

                <input id="issue-search" type="text" placeholder="건의자 이름" value={search} onChange={(e) => setSearch(e.target.value)} />
            </section>

           

            <section className="issue-list-section">

                <div className="issue-list-header">
                    <h3>이슈 목록</h3>
                    <span>{filteredIssues.length}건</span>
                </div>

                <table className="issue-table">
                    <thead>
                        <tr>
                            <th>클라이언트</th>
                            <th>프로젝트</th>
                            <th>이슈제목</th>
                            <th>이슈 ID</th>
                            <th>우선도</th>
                            <th>담당자</th>
                       

                         
                        </tr>
                    </thead>

                    <tbody>
                        {filteredIssues.length > 0 ? (
                            filteredIssues.map((issue) => {
                                const project = projects.find(
                                    (p) => p.id === issue.projectId
                                );
                                return (
                                    <tr key={issue.id}>
                                        <td>{issue.customerName || "-"}</td>
                                        <td>{project?.name || "-"}</td>
                                        {/*수정: 제목 클릭 시 상세 페이지 이동 */}
                                        <td>
                                            <button className="issue-title-link" onClick={() => navigate(`/issue/${issue.id}`)} >
                                                {issue.title}
                                            </button>
                                        </td>
                                        <td> {`ISS-${String(issue.id).padStart(3, "0")}`}</td>
                                        <td>{issue.priority || "보통"}</td>
                                        <td>{issue.reporterName || "-"}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="3" className="issue-empty">
                                    조회된 이슈가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            <p className="issue-footer">
                프로젝트를 선택하면 해당 프로젝트의 이슈만 표시됩니다.
            </p>

        </main>
    );
}

export default Issue;
