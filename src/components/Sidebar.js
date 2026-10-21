
import { useState } from "react";
import "./Sidebar.css";

const menuGroups = [
  {
    title: "업무 관리",
    items: [
      { id: "projects", label: "프로젝트 관리", icon: "▦", children: [
        { id: "project-list", label: "프로젝트 목록" },
        { id: "project-tasks", label: "업무 관리" },
      ]},
      { id: "schedule", label: "일정 관리", icon: "▣" },
      { id: "crm", label: "고객 관리 (CRM)", icon: "♧" },
    ],
  },
  {
    title: "회사 관리",
    items: [
      { id: "hr", label: "인사 관리", icon: "♙", children: [
        { id: "employees", label: "사원 관리" },
        { id: "departments", label: "부서 관리" },
        { id: "evaluations", label: "인사 평가" },
      ]},
      { id: "finance", label: "재무 관리", icon: "₩" },
      { id: "quality", label: "품질 관리", icon: "✓" },
    ],
  },
  {
    title: "시스템",
    items: [
      { id: "admin", label: "관리자 페이지", icon: "⚙" },
    ],
  },
];

function Sidebar({
  activeMenu = "dashboard",
  onMenuChange = () => {},
}) {
  const [expandedMenus, setExpandedMenus] = useState([
    "projects",
    "hr",
  ]);

  const toggleMenu = (id) => {
    setExpandedMenus((prev) =>
      prev.includes(id)
        ? prev.filter((menu) => menu !== id)
        : [...prev, id]
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">N</div>
        <div>
          <h2>NEXUS ERP</h2>
          <span>Enterprise Workspace</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="menu-section-title">WORKSPACE</div>

        <button
          className={`menu-item ${
            activeMenu === "dashboard" ? "active" : ""
          }`}
          onClick={() => onMenuChange("dashboard")}
        >
          <span className="menu-icon">▦</span>
          <span>대시보드</span>
        </button>

        {menuGroups.map((group) => (
          <div className="menu-group" key={group.title}>
            <div className="menu-section-title">
              {group.title}
            </div>

            {group.items.map((item) => {
              const hasChildren = Boolean(item.children);
              const isExpanded = expandedMenus.includes(item.id);

              return (
                <div key={item.id}>
                  <button
                    className={`menu-item ${
                      activeMenu === item.id ||
                      item.children?.some(
                        (child) => child.id === activeMenu
                      )
                        ? "active"
                        : ""
                    }`}
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenu(item.id);
                      } else {
                        onMenuChange(item.id);
                      }
                    }}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-label">
                      {item.label}
                    </span>
                    {hasChildren && (
                      <span className="menu-arrow">
                        {isExpanded ? "⌄" : "›"}
                      </span>
                    )}
                  </button>

                  {hasChildren && isExpanded && (
                    <div className="submenu">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          className={`submenu-item ${
                            activeMenu === child.id ? "active" : ""
                          }`}
                          onClick={() => onMenuChange(child.id)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">관</div>
        <div className="user-info">
          <strong>관리자</strong>
          <span>System Administrator</span>
        </div>
        <button
          className="settings-button"
          title="설정"
          onClick={() => onMenuChange("settings")}
        >
          ⚙
        </button>
      </div>
    </aside>
  );
}

export default Sidebar