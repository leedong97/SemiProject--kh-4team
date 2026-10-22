
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

// 🔴 수정: projects, issues, setIssues를 App에서 전달받는다.
function Issue({ projects, issues, setIssues }) {

    // 🔴 추가: 페이지 이동을 위한 Hook
    const navigate = useNavigate();

    // 선택한 프로젝트
    const [selectedProject, setSelectedProject] = useState("");

    // 검색어
    const [search, setSearch] = useState("");

    // 새 이슈 제목
    const [newIssue, setNewIssue] = useState("");

    // 🔴 추가: 새 이슈 내용
    const [description, setDescription] = useState("");

    // 🔴 추가: 새 이슈 건의자
    const [reporter, setReporter] = useState("");

    // 프로젝트 선택
    const handleProjectChange = (e) => {
        setSelectedProject(e.target.value);
        setSearch("");
    };

    // 프로젝트와 이슈 제목 조건으로 필터링
    const filteredIssues = issues.filter((issue) => {

        const projectMatch =
            selectedProject === "" ||
            issue.projectId === selectedProject;

        const titleMatch =
            issue.title.toLowerCase().includes(search.toLowerCase());

        return projectMatch && titleMatch;
    });

    // 🔴 수정: 이슈 등록 함수
    const handleAddIssue = () => {

        if (selectedProject === "") {
            alert("프로젝트를 먼저 선택해주세요.");
            return;
        }

        if (newIssue.trim() === "") {
            alert("이슈 제목을 입력해주세요.");
            return;
        }

        // 🔴 추가: 이슈 내용 검사
        if (description.trim() === "") {
            alert("이슈 내용을 입력해주세요.");
            return;
        }

        // 🔴 추가: 건의자 검사
        if (reporter.trim() === "") {
            alert("이슈 건의자를 입력해주세요.");
            return;
        }

        // 🔴 추가: 새 이슈 객체 생성
        const issue = {
            id: Date.now(),
            projectId: selectedProject,
            title: newIssue.trim(),
            description: description.trim(),
            reporter: reporter.trim(),
            status: "접수",
            createdAt: new Date().toLocaleDateString("sv-SE")
        };

        // 이슈 상태 업데이트
        setIssues((prevIssues) => [...prevIssues, issue]);

        // 입력값 초기화
        setNewIssue("");
        setDescription("");
        setReporter("");

        // 🔴 추가: 등록한 이슈의 상세 페이지로 이동
        navigate(`/issue/${issue.id}`);
    };

    // 검색 리셋
    const handleReset = () => {
        setSelectedProject("");
        setSearch("");
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

                <button
                    className="issue-reset"
                    onClick={handleReset}
                >
                    검색 리셋
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

                <select
                    id="project-select"
                    value={selectedProject}
                    onChange={handleProjectChange}
                >
                    <option value="">전체 프로젝트</option>

                    {projects.map((project) => (
                        <option
                            key={project.id}
                            value={project.id}
                        >
                            {project.id} - {project.name}
                        </option>
                    ))}
                </select>

                <label htmlFor="issue-search">
                    이슈 제목 검색
                </label>

                <input
                    id="issue-search"
                    type="text"
                    placeholder="이슈 제목 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

            </section>

            <section className="issue-register">
                <h3>새로운 이슈 등록</h3>

                <div className="issue-register-form">

                    {/* 🔴 이슈 제목 */}
                    <input
                        type="text"
                        placeholder="새 이슈 제목을 입력하세요"
                        value={newIssue}
                        onChange={(e) => setNewIssue(e.target.value)}
                    />

                    {/* 🔴 추가: 이슈 내용 */}
                    <textarea
                        placeholder="이슈 발생 내용 및 오류 상황을 입력하세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="5"
                    />

                    {/* 🔴 추가: 이슈 건의자 */}
                    <input
                        type="text"
                        placeholder="이슈 건의자 이름"
                        value={reporter}
                        onChange={(e) => setReporter(e.target.value)}
                    />

                    <button onClick={handleAddIssue}>
                        + 이슈 등록
                    </button>
                </div>
            </section>

            <section className="issue-list-section">

                <div className="issue-list-header">
                    <h3>이슈 목록</h3>
                    <span>{filteredIssues.length}건</span>
                </div>

                <table className="issue-table">
                    <thead>
                        <tr>
                            <th>이슈 ID</th>
                            <th>프로젝트</th>
                            <th>이슈 제목</th>
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
                                        <td>
                                            {`ISS-${String(issue.id).padStart(3, "0")}`}
                                        </td>

                                        <td>{project?.name || "-"}</td>

                                        {/* 🔴 수정: 제목 클릭 시 상세 페이지 이동 */}
                                        <td>
                                            <button
                                                className="issue-title-link"
                                                onClick={() =>
                                                    navigate(`/issue/${issue.id}`)
                                                }
                                            >
                                                {issue.title}
                                            </button>
                                        </td>
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
