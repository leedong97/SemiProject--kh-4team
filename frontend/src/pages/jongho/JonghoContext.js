import { API_BASE } from '../../shared/config';
import { adminRequest } from './adminApi';
import { createContext, useContext, useState, useEffect } from 'react';

// 백엔드 주소 (Login.js 와 같은 서버)

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
      status: "예정",
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
    const [data, setData] = useState(initialData);

    // API 하나가 실패해도 나머지 목록은 정상 표시합니다.
    useEffect(() => {
        let cancelled = false;
        async function loadFromServer() {
            const names = ['employees', 'evaluations', 'issues'];
            for (const name of names) {
                try {
                    const rows = await adminRequest('/' + name);
                    if (!cancelled && Array.isArray(rows)) {
                        const items = name === 'issues' ? rows.map(issue => ({ comments: [], history: [], ...issue })) : rows;
                        setData(prev => ({ ...prev, [name]: items }));
                    }
                } catch (error) {
                    console.error(name + ' 목록 오류:', error.message);
                }
            }
        }
        loadFromServer();
        return () => { cancelled = true; };
    }, []);

    // 모든 변경은 이 함수 하나로 처리해 데이터와 감사 로그를 함께 저장합니다.
    function changeData(action, updater) {
        setData(previous => {
            const next = updater(previous);
            const logs = [{ id: Date.now() + Math.random(), action, at: new Date().toLocaleString("ko-KR") }, ...previous.logs].slice(0, 100);
            const result = { ...next, logs };
            // 인사·평가 정보가 브라우저에 남지 않도록 localStorage에 저장하지 않습니다.
            return result;
        });
    }

    function resetData() {
        localStorage.removeItem(STORAGE_KEY);
        setData(initialData);
    }

    return { data, changeData, resetData };
}

function useProjects() {
    const [projects, setProjectsState] = useState([]);
    const [projectError, setProjectError] = useState('');
    async function loadProjects() {
        try {
            const rows = await adminRequest('/projects');
            setProjectsState(Array.isArray(rows) ? rows : []);
            setProjectError('');
        } catch (error) {
            setProjectError(error.message);
            console.error('프로젝트 조회 오류:', error);
        }
    }
    useEffect(() => {
        loadProjects();
    }, []);
    // 서버 변경 성공 후 다시 조회해 DB와 화면을 일치시킵니다.
    async function createProject(project) {
        await adminRequest('/projects', { method: 'POST', body: JSON.stringify(project) });
        await loadProjects();
    }
    async function updateProject(id, changes) {
        await adminRequest('/projects/' + id, { method: 'PATCH', body: JSON.stringify(changes) });
        await loadProjects();
    }
    async function removeProject(id) {
        await adminRequest('/projects/' + id, { method: 'DELETE' });
        await loadProjects();
    }
    // 기존 함수명을 유지하되 DB 반영이 필요한 곳은 위 함수를 사용합니다.
    function setProjects(next) {
        setProjectsState(previous => (typeof next === 'function' ? next(previous) : next));
    }
    return { projects, setProjects, resetProjects: loadProjects, createProject, updateProject, removeProject, projectError };
}

const JonghoContext = createContext(null);

export function useJongho() {
  return useContext(JonghoContext);
}

export function JonghoProvider({ children }) {
  const { data, changeData, resetData } = useErpData();
  const { projects, setProjects, resetProjects, createProject, updateProject, removeProject, projectError } = useProjects();

  function resetDemo() {
    if (!window.confirm("모든 연습 데이터를 초기화할까요?")) return;
    resetData();
    resetProjects();
  }

  const value = { data, changeData, projects, setProjects, resetDemo, createProject, updateProject, removeProject, projectError };

  return <JonghoContext.Provider value={value}>{children}</JonghoContext.Provider>;
}