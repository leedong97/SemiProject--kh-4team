import logo from './logo.svg';
import './App.css';

import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// 관리자 페이지의 공통 레이아웃
import AdminLayout from "./admin/AdminLayout";

// 관리자 페이지별 컴포넌트
import Dashboard from "./admin/pages/Dashboard";
import ProjectManagement from "./admin/pages/ProjectManagement";
import ManagerAssignment from "./admin/pages/ManagerAssignment";

// 프로젝트 및 직원 임시 데이터
import { initialProjects, employees } from "./admin/data/mockData";

function App() {
  const [projects, setProjects] = useState(initialProjects);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={<Dashboard projects={projects} />}
          />

          <Route
            path="projects"
            element={
              <ProjectManagement
                projects={projects}
                setProjects={setProjects}
              />
            }
          />

          <Route
            path="assignments"
            element={
              <ManagerAssignment
                projects={projects}
                setProjects={setProjects}
                employees={employees}
              />
            }
          />
        </Route>

        {/* 다른 팀원 페이지의 Route는 여기에 유지 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
