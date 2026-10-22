import React from "react";
import { useNavigate } from "react-router-dom";

function UnassignedProjects({ projects }) {
    const navigate = useNavigate();

// 담당자가 없는 프로젝트 중 승인 대기와 배정 대기를 표시
const unassigned = projects.filter(
    (project) =>
      project.managerId == null &&
      (
        project.status === "승인 대기" ||
        project.status === "배정 대기"
      )
  );

    return (
        <div className="nexus-panel">
            <h3>1. 미배정 프로젝트</h3>
            <p>담당 PM 및 참여 인력 지정이 필요한 프로젝트</p>

            {unassigned.length === 0 && (
                <p>미배정 프로젝트가 없습니다.</p>
            )}

            {unassigned.map((project) => (
                <div className="nexus-project-card" key={project.id}>
                    <span className="nexus-waiting">배정 대기</span>

                    <h4>{project.name}</h4>
                    <p>PM 미지정</p>

                    <button
                        onClick={() => navigate("/admin/assignments")}
                    >
                        프로젝트 담당자 배정 →
                    </button>
                </div>
            ))}
        </div>
    );
}

export default UnassignedProjects;