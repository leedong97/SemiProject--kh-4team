import React, { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./MergedModules.css";
import AdminLayout from "./jonho/AdminLayout";
import Dashboard from "./jonho/pages/Dashboard";
import ProjectManagement from "./jonho/pages/ProjectManagement";
import ManagerAssignment from "./jonho/pages/ManagerAssignment";
import IssueManagement from "./heeseung/components/IssueManagement";
import HRManagement from "./heeseung/components/HRManagement";
import EmployeeEvaluation from "./heeseung/components/EmployeeEvaluation";
import Login from "./heeseung/components/Login";
import useErpData from "./common/data/useErpData";
import useProjects from "./jonho/data/useProjects";

export default function App() {
    // 로그인은 화면 시연용입니다. 실제 관리자 보안은 서버가 필요합니다.
    const [loggedIn, setLoggedIn] = useState(false);
    const { data, changeData, resetData } = useErpData();
    const { projects, setProjects, resetProjects } = useProjects();

    function resetDemo() {
        if (!window.confirm("모든 연습 데이터를 초기화할까요?")) return;
        resetData();
        resetProjects();
    }


    return (
        <BrowserRouter>
            <Routes>

                {/* 로그인 */}
                <Route
                    path="/login"
                    element={
                        loggedIn ? (
                            <Navigate to="/admin" replace />
                        ) : (
                            <Login
                                onLogin={() => setLoggedIn(true)}
                            />
                        )
                    }
                />

                {/* 관리자 페이지 */}
                <Route
                    path="/admin"
                    element={
                        loggedIn ? (
                            <AdminLayout
                                onLogout={() => setLoggedIn(false)}
                            />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                >

                    {/* 대시보드 */}
                    <Route
                        index
                        element={
                            <Dashboard
                                projects={projects}
                                data={data}
                            />
                        }
                    />

                    {/* 프로젝트 관리 */}
                    <Route
                        path="projects"
                        element={
                            <ProjectManagement
                                projects={projects}
                                setProjects={setProjects}
                            />
                        }
                    />

                    {/* 담당자 배정 */}
                    <Route
                        path="assignments"
                        element={
                            <ManagerAssignment
                                projects={projects}
                                setProjects={setProjects}
                                employees={data.employees.map(
                                    (e) => ({
                                        ...e,
                                        role: e.role || e.position
                                    })
                                )}
                            />
                        }
                    />

                    {/* 이슈 관리 */}
                    <Route
                        path="issues"
                        element={
                            <div className="merge-erp-module">
                                <IssueManagement
                                    data={data}
                                    changeData={changeData}
                                />
                            </div>
                        }
                    />

                    {/* 직원 관리 */}
                    <Route
                        path="employees"
                        element={
                            <div className="merge-erp-module">
                                <HRManagement
                                    data={data}
                                    changeData={changeData}
                                />
                            </div>
                        }
                    />

                    {/* 직원 평가 */}
                    <Route
                        path="evaluations"
                        element={
                            <div className="merge-erp-module">
                                <EmployeeEvaluation
                                    data={data}
                                    changeData={changeData}
                                />
                            </div>
                        }
                    />

                    {/* 공지 관리 */}
                    <Route
                        path="boards"
                        element={
                            <div className="merge-placeholder">
                                <h2>공지 관리</h2>
                                <p>
                                    이 메뉴는 기존 프로젝트의
                                    확장 공간으로 남겨두었습니다.
                                </p>
                            </div>
                        }
                    />

                    {/* 연습 데이터 관리 */}
                    <Route
                        path="settings"
                        element={
                            <div className="merge-placeholder">
                                <h2>연습 데이터 관리</h2>
                                <button onClick={resetDemo}>
                                    샘플 데이터 초기화
                                </button>
                            </div>
                        }
                    />

                </Route>

                {/* 존재하지 않는 주소 처리 */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to={loggedIn ? "/admin" : "/login"}
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );

}
