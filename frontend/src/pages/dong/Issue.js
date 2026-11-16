import ListSort, { sortList } from "../../shared/ListSort";
import Pagination from "../../shared/Pagination";
import SearchInput from "../../shared/SearchInput";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Priority } from "../../shared/priority";

// 수정: projects, issues, setIssues를 App에서 전달받는다.
function Issue({ projects, issues, setIssues }) {


    const navigate = useNavigate();
    const [searchResetKey, setSearchResetKey] = useState(0);
    const [selectedProject, setSelectedProject] = useState("");
    const [search, setSearch] = useState("");
    const [searchPerson, setSearchPerson] = useState("")
    const [issueView, setIssueView] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOption, setSortOption] = useState("default");
    const pageSize = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedProject, search, searchPerson, issueView, sortOption]);
    const handleProjectChange = (e) => {
        setSelectedProject(e.target.value);
        setSearch("");
        setSearchResetKey((key) => key + 1);
    };

    const filteredIssues = sortList(issues.filter((issue) => {
        const projectMatch =
            selectedProject === "" ||
            String(issue.projectId) === selectedProject;

        const titleMatch =
            (issue.title ?? "")
                .toLowerCase()
                .includes(search.trim().toLowerCase());

        const personMatch =
            (issue.assigneeName ?? "")
                .toLowerCase()
                .includes(searchPerson.trim().toLowerCase());

        const statusMatch =
            issueView === "all" ||
            (issueView === "received" && issue.status === "접수") ||
            (issueView === "progress" && issue.status === "진행 중") ||
            (issueView === "review" && issue.status === "검토 중") ||
            (issueView === "completed" && issue.status === "완료");

        return projectMatch && titleMatch && personMatch && statusMatch;
    }), sortOption);
    const totalPages = Math.max(1, Math.ceil(filteredIssues.length / pageSize));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * pageSize;
    const pagedIssues = filteredIssues.slice(startIndex, startIndex + pageSize);


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

           
            <ListSort kind="issue" value={sortOption} onChange={setSortOption} />
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

                <SearchInput key={searchResetKey} id="issue-search" type="text" placeholder="이슈 제목 검색" value={search} onChange={(e) => setSearch(e.target.value)} />

                <label htmlFor="issue-assignee-search">
                    이슈 담당자 검색
                </label>

                <SearchInput key={searchResetKey} id="issue-assignee-search" type="text" placeholder="담당자 이름" value={searchPerson} onChange={(e) => setSearchPerson(e.target.value)} />
            </section>



            <section className="issue-list-section">

                <div className="issue-list-header">
                    <h3>
                        {{ all: "전체 이슈 목록", received: "접수된 이슈", progress: "진행 중인 이슈", review: "검토 중인 이슈", completed: "완료된 이슈" }[issueView]}
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

                <button type="button" aria-pressed={issueView === "received"} onClick={() => setIssueView("received")}>접수</button>
                <button type="button" aria-pressed={issueView === "progress"} onClick={() => setIssueView("progress")}>진행 중</button>

                <button
                    type="button"
                    aria-pressed={issueView === "review"}
                    onClick={() => setIssueView("review")}
                >
                    검토 중
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
                            <th>담당자</th>
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
                                        <td>
                                            {project ? (
                                                <span className="issue-project">
                                                    <span>{project.name}</span>
                                                </span>
                                            ) : "-"}
                                        </td>
                                        {/*수정: 제목 클릭 시 상세 페이지 이동 */}
                                        <td>
                                            <button className="issue-title-link" onClick={() => navigate(`/issue/${issue.id}`)} >
                                                {issue.title}
                                            </button>
                                        </td>
                                        <td><Priority value={issue.priority} /></td>
                                        <td>{issue.assigneeName || "-"}</td>
                                        <td>
                                            {/* 상태별 노선색 칩 (색은 shared/pages.css) */}
                                            <span className="issue-status" data-status={issue.status || ""}>
                                                {issue.status || "-"}
                                            </span>
                                        </td>
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

            <Pagination total={filteredIssues.length} currentPage={activePage} onPage={setCurrentPage} label="목록 페이지" />

     

        </main>
    );
}

export default Issue;
