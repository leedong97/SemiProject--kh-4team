
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../shared/config";

// 수정: projects, issues, setIssues를 App에서 전달받는다.
function Issue({ projects, issues, setIssues }) {


    const navigate = useNavigate();
    const [selectedProject, setSelectedProject] = useState("");
    const [search, setSearch] = useState("");
    const [searchPerson, setSearchPerson] = useState("")
    const [issueView, setIssueView] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // 메인 이슈 목록에 들어올 때마다 DB의 최신 상태를 다시 불러옵니다.
    useEffect(() => {
        let cancelled = false;

        async function refreshIssues() {
            try {
                const response = await fetch(`${API_BASE}/api/dong/issues`);
                if (!response.ok) throw new Error("이슈 목록 조회 실패");
                const rows = await response.json();
                if (!cancelled && Array.isArray(rows)) setIssues(rows);
            } catch (error) {
                console.error("이슈 상태 새로고침 실패:", error);
            }
        }

        refreshIssues();
        return () => { cancelled = true; };
    }, [setIssues]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProject, search, searchPerson, issueView]);
    const handleProjectChange = (e) => {
        setSelectedProject(e.target.value);
        setSearch("");
    };

    const filteredIssues = issues.filter((issue) => {
        const projectMatch =
            selectedProject === "" ||
            String(issue.projectId) === selectedProject;

        const titleMatch =
            (issue.title ?? "")
                .toLowerCase()
                .includes(search.trim().toLowerCase());

        const personMatch =
            (issue.reporterName ?? "")
                .toLowerCase()
                .includes(searchPerson.trim().toLowerCase());

        const statusMatch =
            issueView === "all" ||
            (issueView === "review" && issue.status === "검토 중") ||
            (issueView === "progress" && issue.status === "진행 중") ||
            (issueView === "completed" && issue.status === "완료");

        return projectMatch && titleMatch && personMatch && statusMatch;
    });
    const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * pageSize;
    const pagedIssues = filteredIssues.slice(startIndex, startIndex + pageSize);
    const firstPageInGroup = Math.floor((activePage - 1) / 5) * 5 + 1;
    const pageNumbers = Array.from(
        { length: Math.min(5, totalPages - firstPageInGroup + 1) },
        (_, index) => firstPageInGroup + index
    );

    // 마지막 페이지의 데이터가 삭제되면 남아 있는 마지막 페이지로 이동합니다.
    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

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

                <div className="issue-header-actions">
                    <button className="issue-reset" onClick={handleIssueRequest}>
                        이슈 건의
                    </button>
                    <button className="issue-reset" onClick={() => navigate("/issue/completion-request")}>
                        이슈 완료 요청
                    </button>
                </div>
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

                <input id="issue-search" type="text" placeholder="건의자 이름" value={searchPerson} onChange={(e) => setSearchPerson(e.target.value)} />
            </section>



            <section className="issue-list-section">

                <div className="issue-list-header">
                    <h3>
                        {{ all: "전체 이슈 목록", review: "검토 중인 이슈", progress: "진행 중인 이슈", completed: "완료된 이슈" }[issueView]}
                    </h3>
                    <span>{filteredIssues.length}건</span>
                </div>
                <div className="issue-view-switch" role="group" aria-label="이슈 목록 구분">
                    <button
                        type="button"
                        aria-pressed={issueView === "all"}
                        onClick={() => setIssueView("all")}
                    >
                        전체 이슈
                    </button>

                    <button
                        type="button"
                        aria-pressed={issueView === "review"}
                        onClick={() => setIssueView("review")}
                    >
                        검토 중
                    </button>

                    <button
                        type="button"
                        aria-pressed={issueView === "progress"}
                        onClick={() => setIssueView("progress")}
                    >
                        진행 중
                    </button>

                    <button
                        type="button"
                        aria-pressed={issueView === "completed"}
                        onClick={() => setIssueView("completed")}
                    >
                        완료
                    </button>
                </div>

                <table className="issue-table">
                    <thead>
                        <tr>
                            <th scope="col" className="issue-row-number">번호</th>
                            <th>클라이언트</th>
                            <th>프로젝트</th>
                            <th>이슈제목</th>
                            <th>우선도</th>
                            <th>건의자</th>
                            <th>상태</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredIssues.length > 0 ? (
                            pagedIssues.map((issue, index) => {
                                const project = projects.find(
                                    (p) => p.id === issue.projectId
                                );
                                return (
                                    <tr key={issue.id}>
                                        <td className="issue-row-number">{startIndex + index + 1}</td>
                                        <td>{issue.customerName || "-"}</td>
                                        <td>{project?.name || "-"}</td>
                                        {/*수정: 제목 클릭 시 상세 페이지 이동 */}
                                        <td>
                                            <button className="issue-title-link" onClick={() => navigate(`/issue/${issue.id}`)} >
                                                {issue.title}
                                            </button>
                                        </td>
                                        <td>{issue.priority || "보통"}</td>
                                        <td>{issue.reporterName || "-"}</td>
                                        <td>{issue.status || "-"}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="issue-empty">
                                    조회된 이슈가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {filteredIssues.length > 0 && (
                <nav className="issue-pagination" aria-label="이슈 목록 페이지">
                    <span className="issue-pagination-summary" aria-live="polite">
                        전체 {filteredIssues.length}건 중 {startIndex + 1}–{startIndex + pagedIssues.length}건
                    </span>
                    <div className="issue-pagination-buttons">
                        <button type="button" disabled={activePage === 1}
                            onClick={() => setCurrentPage(activePage - 1)}>이전</button>
                        {pageNumbers.map((page) => (
                            <button key={page} type="button" aria-label={`${page}페이지`}
                                aria-current={activePage === page ? "page" : undefined}
                                onClick={() => setCurrentPage(page)}>{page}</button>
                        ))}
                        <button type="button" disabled={activePage === totalPages}
                            onClick={() => setCurrentPage(activePage + 1)}>다음</button>
                    </div>
                </nav>
            )}

            <p className="issue-footer">
                프로젝트를 선택하면 해당 프로젝트의 이슈만 표시됩니다.
            </p>

        </main>
    );
}

export default Issue;
