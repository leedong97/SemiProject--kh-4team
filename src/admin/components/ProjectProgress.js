import React from "react";

function ProjectProgress({ projects = [] }) {

  // 진행 중인 프로젝트만 가져오기
  const ongoingProjects = projects.filter(
    (project) =>
      project.status === "진행중" ||
      project.status === "진행 중"
  );

  // 전달받은 프로젝트 데이터 확인
  console.log("ProjectProgress 전체 프로젝트:", projects);

  // 진행 중 조건을 통과한 프로젝트 확인
  console.log("ProjectProgress 진행 중 프로젝트:", ongoingProjects);

  return (
    <div className="nexus-panel nexus-progress-panel">

      <h3>2. 프로젝트 진행률 비교</h3>

      <p>계획 대비 실제 진행률을 비교합니다.</p>
      전달받은 프로젝트: {projects.length}건 /
      진행 중 프로젝트: {ongoingProjects.length}건

      {ongoingProjects.length === 0 ? (
        <p>진행 중인 프로젝트가 없습니다.</p>
      ) : (
        ongoingProjects.map((project) => (
          <div
            key={project.id}
            style={{
              marginTop: "20px",
              paddingBottom: "15px",
              borderBottom: "1px solid #eee"
            }}
          >

            <h4>{project.name}</h4>

            <p>실제 진행률: {project.progress ?? 0}%</p>

            <progress
              value={project.progress ?? 0}
              max="100"
              style={{ width: "100%" }}
            />

            <p>계획 진행률: {project.plannedProgress ?? 0}%</p>

            <progress
              value={project.plannedProgress ?? 0}
              max="100"
              style={{ width: "100%" }}
            />

          </div>
        ))
      )}

    </div>
  );
}

export default ProjectProgress;