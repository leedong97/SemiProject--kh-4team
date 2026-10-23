import React from "react";

function DashboardStats({ projects = [] }) {

    // 전체 프로젝트 개수
    const total = projects.length;

    // 진행 중 프로젝트 개수
    const ongoing = projects.filter(
        (project) =>
            project.status === "진행중" ||
            project.status === "진행 중"
    ).length;

    // 담당자가 없는 배정 대기 프로젝트 개수
    const unassigned = projects.filter((project) =>
        project.status === "배정 대기" &&
        project.managerId == null
    ).length;

    return (
        <div className="nexus-stats">

            {/* 전체 프로젝트 */}
            <div className="nexus-stat-card">
                <p>전체 프로젝트</p>
                <h2>{total}<small> 건</small></h2>
            </div>

            {/* 진행 중 프로젝트 */}
            <div className="nexus-stat-card">
                <p>진행 중</p>
                <h2>{ongoing}<small> 건</small></h2>
            </div>

            {/* 미배정 프로젝트 */}
            <div className="nexus-stat-card">
                <p>미배정</p>
                <h2>{unassigned}<small> 건</small></h2>
            </div>

        </div>
    );
}

export default DashboardStats;