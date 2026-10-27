import { createContext, useContext, useState } from 'react';

// 종호 페이지(관리자)가 같이 쓰는 데이터 상자
// 샘플 데이터(initialData, initialProjects)와 저장 로직을 이 파일 한 곳에서 관리합니다.

// ── 샘플 데이터 (연습용, 실제 직원 정보 아님) ─────────────────

// 프로젝트 샘플
export const initialProjects = [
    {
      id: 1,
      name: "ERP 시스템 개발",
      status: "진행중",
      progress: 75,
      managerId: 1
    },
    {
      id: 2,
      name: "관리자 UI 개발",
      status: "진행중",
      progress: 50,
      managerId: null
    },
    {
      id: 3,
      name: "API 서버 연동",
      status: "배정 대기",
      progress: 0,
      managerId: null
    }
  ];

// ERP(인사·이슈·업무·평가·휴가) 샘플
export const initialData = {
    employees: [
        { id: 1, name: "김민수", team: "개발팀", position: "백엔드", role: "백엔드", rank: "팀장", status: "재직" },
        { id: 2, name: "이서연", team: "개발팀", position: "프론트엔드", role: "프론트엔드", rank: "사원", status: "재직" },
        { id: 3, name: "박지훈", team: "개발팀", position: "풀스택", role: "풀스택", rank: "대리", status: "재직" }
    ],
    issues: [
        { id: 1, title: "로그인 API 오류", assigneeId: 1, priority: "긴급", status: "진행 중", due: "2026-11-01", comments: ["오류 재현 확인"], history: [] },
        { id: 2, title: "모바일 화면 깨짐", assigneeId: 2, priority: "보통", status: "검토 중", due: "2026-11-05", comments: [], history: [] }
    ],
    tasks: [],
    evaluations: [],
    leaves: [],
    logs: []
};

// ── 저장 로직 ────────────────────────────────────────────────
const STORAGE_KEY = "it_erp_react_demo_v1";

// 최초 실행은 샘플 데이터, 이후에는 브라우저에 저장된 데이터를 사용합니다.
function readData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && Array.isArray(saved.issues) && Array.isArray(saved.employees)) {
            return { ...initialData, ...saved };
        }
    } catch (error) {
        console.warn("저장된 데이터를 읽지 못했습니다.", error);
    }
    return initialData;
}

function useErpData() {
    const [data, setData] = useState(readData);

    // 모든 변경은 이 함수 하나로 처리해 데이터와 감사 로그를 함께 저장합니다.
    function changeData(action, updater) {
        setData(previous => {
            const next = updater(previous);
            const logs = [{ id: Date.now() + Math.random(), action, at: new Date().toLocaleString("ko-KR") }, ...previous.logs].slice(0, 100);
            const result = { ...next, logs };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
            return result;
        });
    }

    function resetData() {
        localStorage.removeItem(STORAGE_KEY);
        setData(initialData);
    }

    return { data, changeData, resetData };
}

const KEY = "nexus_merged_projects_v1";

function useProjects() {
    const [projects, setProjectsState] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(KEY));
            return Array.isArray(saved) ? saved : initialProjects;
        } catch (error) {
            return initialProjects;
        }
    });
    function setProjects(next) {
        setProjectsState(previous => {
            const value = typeof next === "function" ? next(previous) : next;
            localStorage.setItem(KEY, JSON.stringify(value));
            return value;
        });
    }
    function resetProjects() {
        localStorage.removeItem(KEY);
        setProjectsState(initialProjects);
    }
    return { projects, setProjects, resetProjects };
}

const JonghoContext = createContext(null);

export function useJongho() {
  return useContext(JonghoContext);
}

export function JonghoProvider({ children }) {
  const { data, changeData, resetData } = useErpData();
  const { projects, setProjects, resetProjects } = useProjects();

  function resetDemo() {
    if (!window.confirm("모든 연습 데이터를 초기화할까요?")) return;
    resetData();
    resetProjects();
  }

  const value = { data, changeData, projects, setProjects, resetDemo };

  return <JonghoContext.Provider value={value}>{children}</JonghoContext.Provider>;
}
