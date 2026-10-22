import React, { useState } from "react";
import DashboardStats from "../components/DashboardStats";
import UnassignedProjects from "../components/UnassignedProjects";
import ProjectProgress from "../components/ProjectProgress";
import "../styles/Dashboard.css";

function Dashboard({ projects = [] }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("전체");

    // 프로젝트 검색 및 상태 필터
    const filteredProjects = projects.filter((project) => {

        const keyword = search.toLowerCase();

        // 프로젝트명 검색
        const matchSearch = project.name
            .toLowerCase()
            .includes(keyword);

        // 상태별 검색
        const matchFilter =
            filter === "전체" ||

            // 진행 중 프로젝트
            (filter === "진행 중" &&
                (project.status === "진행중" ||
                    project.status === "진행 중")) ||

            // 승인 후 담당자 미배정 프로젝트
            (filter === "배정 대기" &&
                project.status === "배정 대기" &&
                project.managerId == null);

        return matchSearch && matchFilter;
    });

    return (
        <div className="nexus-dashboard">
            <div className="nexus-dashboard-title">
                <div>
                    <h2>관리자 대시보드</h2>
                    <p>프로젝트 현황 및 인력 배정 대기 업무</p>
                </div>
                <span>ADMIN</span>
            </div>

            {/* 전체 / 진행 중 / 미배정 통계 */}
            <DashboardStats projects={projects} />

            <div className="nexus-search">
                <input
                    placeholder="프로젝트명, 고객사, 프로젝트 ID 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={() => setSearch("")}>✕</button>
            </div>

            <div className="nexus-filters">
                {["전체", "진행 중", "배정 대기"].map((item) => (
                    <button
                        key={item}
                        className={filter === item ? "selected" : ""}
                        onClick={() => setFilter(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {/* 선택한 필터에 따라 화면 변경 */}
            <div
                className={
                    filter === "전체"
                        ? "nexus-dashboard-grid"
                        : "nexus-dashboard-grid single"
                }
            >
                {/* 전체 또는 배정 대기 선택 시 미배정 목록 표시 */}
                {(filter === "전체" || filter === "배정 대기") && (
                    <UnassignedProjects projects={filteredProjects} />
                )}

                {/* 전체 또는 진행 중 선택 시 진행률 표시 */}
                {(filter === "전체" || filter === "진행 중") && (
                    <ProjectProgress projects={filteredProjects} />
                )}
            </div>
        </div>
    );
}

export default Dashboard;