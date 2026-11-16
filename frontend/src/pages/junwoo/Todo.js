import ListSort, { sortList } from "../../shared/ListSort";
import Pagination from "../../shared/Pagination";
import SearchInput from "../../shared/SearchInput";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import getLoginUser from "../woojin/getLoginUser";
import { StationStrip } from "../../shared/subway";
import { Priority } from "../../shared/priority";
import "./ProjectList.css";

const STATUS_TABS = [
    "전체",
    "예정",
    "진행중",
    "완료 요청",
    "완료",
    "보류"
];

const PAGE_SIZE = 10;

function Todo({ todo = [] }) {

    const [selectedProject, setSelectedProject] = useState("");
    const [search, setSearch] = useState("");
    const [searchManager, setSearchManager] = useState("");
    const [status, setStatus] = useState("전체");
    const [page, setPage] = useState(1);
    const [sortOption, setSortOption] = useState("default");

    useEffect(() => {
        setPage(1);
    }, [selectedProject, search, searchManager, status, sortOption]);

    const filteredProjects = sortList(todo
        .filter(project => {
            const matchesProject =
                selectedProject === "" ||
                String(project.id) === selectedProject;

            const matchesTitle = String(project.title ?? "")
                .toLowerCase()
                .includes(search.trim().toLowerCase());

            const matchesManager = String(project.managerName ?? "")
                .toLowerCase()
                .includes(searchManager.trim().toLowerCase());

            const matchesStatus =
                status === "전체" ||
                project.status === status;

            return (
                matchesProject &&
                matchesTitle &&
                matchesManager &&
                matchesStatus
            );
        })
        , sortOption);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredProjects.length / PAGE_SIZE)
    );

    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const pageItems = filteredProjects.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );



    useEffect(() => {
        setPage(previous => Math.min(previous, totalPages));
    }, [totalPages]);

    // 검색 리셋 버튼 주석
    // function resetFilters() {
    //     setSelectedProject("");
    //     setSearch("");
    //     setSearchManager("");
    //     setStatus("전체");
    //     setPage(1);
    // }

    const listTitle =
        status === "전체"
            ? "전체 프로젝트 목록"
            : `${status} 프로젝트 목록`;

    return (
        <main className="junwoo-project-list">
            <header className="jpl-header">
                <div>
                    <h1>SI 프로젝트 목록</h1>
                </div>

                <div className="jpl-header-actions">
                    {/* 검색 리셋 버튼 주석 */}
                    {/* <button
                        type="button"
                        className="jpl-reset"
                        onClick={resetFilters}
                    >
                        검색 리셋
                    </button> */}

                    <Link to="/todo/completion" className="jpl-reset">
                        프로젝트 완료 요청
                    </Link>
                </div>
            </header>

            <div className="jpl-summary" aria-live="polite">
                <span>전체 프로젝트 {todo.length}개</span>
                <span>조회된 프로젝트 {filteredProjects.length}개</span>
            </div>

            <ListSort kind="project" value={sortOption} onChange={setSortOption} />
            <section className="jpl-filter" aria-label="프로젝트 검색">
                <label htmlFor="jpl-project">프로젝트 선택</label>
                <select
                    id="jpl-project"
                    value={selectedProject}
                    onChange={event =>
                        setSelectedProject(event.target.value)
                    }
                >
                    <option value="">전체 프로젝트</option>

                    {todo.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.id} - {project.title}
                        </option>
                    ))}
                </select>

                <label htmlFor="jpl-title">프로젝트 제목 검색</label>
                <SearchInput
                    id="jpl-title"
                    type="search"
                    placeholder="프로젝트 제목 검색"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                />

                <label htmlFor="jpl-manager">프로젝트 담당자 검색</label>
                <SearchInput
                    id="jpl-manager"
                    type="search"
                    placeholder="담당자 이름"
                    value={searchManager}
                    onChange={event =>
                        setSearchManager(event.target.value)
                    }
                />
            </section>

            <section className="jpl-results" aria-labelledby="jpl-heading">
                <div className="jpl-list-header">
                    <h2 id="jpl-heading">{listTitle}</h2>
                    <span>{filteredProjects.length}건</span>
                </div>

                <div
                    className="jpl-tabs"
                    role="group"
                    aria-label="프로젝트 상태"
                >
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab}
                            type="button"
                            aria-pressed={status === tab}
                            onClick={() => setStatus(tab)}
                        >
                            {tab === "전체" ? "전체 프로젝트" : tab}
                        </button>
                    ))}
                </div>

                <div className="jpl-table-wrap">
                    <table className="jpl-table">
                        <thead>
                            <tr>
                                <th scope="col">번호</th>
                                <th scope="col">클라이언트</th>
                                <th scope="col">프로젝트</th>
                                <th scope="col">담당자</th>
                                <th scope="col">진행률</th>
                                <th scope="col">상태</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pageItems.length > 0 ? (
                                pageItems.map((project, index) => (
                                    <tr key={project.id}>
                                        <td>{startIndex + index + 1}</td>

                                        <td>
                                            {project.customerName || "-"}
                                        </td>

                                        <td className="jpl-project-title">
                                            <Link to={`/todo/${project.id}`} className="jpl-project-link">
                                                <span>{project.title}</span>
                                            </Link>
                                        </td>

                                     

                                        <td>
                                            {project.managerName || "미지정"}
                                        </td>

                                        <td>
                                            <StationStrip project={project} />
                                        </td>

                                        <td>
                                            <span
                                                className="jpl-status"
                                                data-status={project.status}
                                            >
                                                {project.status || "-"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="jpl-empty">
                                        조회된 프로젝트가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <Pagination total={filteredProjects.length} currentPage={currentPage} onPage={setPage} label="목록 페이지" />

          
        </main>
    );
}

export default Todo;