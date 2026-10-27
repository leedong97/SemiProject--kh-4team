import React from "react";
import { useNavigate } from "react-router-dom";

function AdminLayout({ onLogout }) {

    const navi = useNavigate()

    // 관리자 상단 메뉴
    const menus = [
        { name: "대시보드", path: "/admin", end: true },
        { name: "프로젝트 관리", path: "/admin/projects" },
        { name: "담당자 배정", path: "/admin/assignments" },
        { name: "이슈 관리", path: "/admin/issues" },
        { name: "인사 관리", path: "/admin/employees" },
        { name: "직원 평가", path: "/admin/evaluations" },
        { name: "공지 관리", path: "/admin/boards" },
        { name: "데이터 초기화", path: "/admin/settings" },
    ]

    return (
        <div className="nexus-admin-layout">

            {/* 상단 네비게이션 */}
            <header className="nexus-admin-header">

                <div className="nexus-admin-top">

                    <div className="nexus-logo-area">
                        <div className="nexus-logo">N</div>

                        <div>
                            <h2>NEXUS ERP</h2>
                            <p>ADMIN WORKSPACE</p>
                        </div>
                    </div>
                </div>
            </header>

        </div>
    )
}