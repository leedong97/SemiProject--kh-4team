
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";
import EmployeeManagement from "./pages/EmployeeManagement";

const menuNames = {
  dashboard: "대시보드",
  projects: "프로젝트 관리",
  "project-list": "프로젝트 목록",
  "project-tasks": "업무 관리",
  schedule: "일정 관리",
  crm: "고객 관리 (CRM)",
  hr: "인사 관리",
  employees: "사원 관리",
  departments: "부서 관리",
  evaluations: "인사 평가",
  finance: "재무 관리",
  quality: "품질 관리",
  admin: "관리자 페이지",
  settings: "설정",
};

function App() {
  const [activeMenu, setActiveMenu] = useState("dashboard");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
    }}>
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      />

      <main className="app-content">
        {activeMenu === "admin" ? (
          <AdminDashboard   onMenuChange={setActiveMenu}/>
        ) : activeMenu === "employees" ? (
          <EmployeeManagement />
        ) : (
          <>
            <h1>
              {activeMenu === "dashboard"
                ? "안녕하세요, 관리자님 👋"
                : menuNames[activeMenu] ?? activeMenu}
            </h1>

            {/* 기존 기본 화면 내용은 그대로 유지 */}
          </>
        )}
      </main>
    </div>
  );
}

export default App