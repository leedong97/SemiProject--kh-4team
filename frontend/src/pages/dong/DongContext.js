import { API_BASE } from '../../shared/config';
import { createContext, useContext, useState, useEffect } from 'react';

// 동협 페이지(이슈관리)가 같이 쓰는 데이터 상자
const DongContext = createContext(null);

export function useDong() {
  return useContext(DongContext);
}

export function DongProvider({ children }) {
  // DB에서 받아온 이슈 목록
  const [issues, setIssues] = useState([]);

  // DB에서 받아온 프로젝트 목록
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [issueResponse, projectResponse] = await Promise.all([
          fetch(`${API_BASE}/api/dong/issues`),
          fetch(`${API_BASE}/api/dong/projects`)
        ]);

        if (!issueResponse.ok || !projectResponse.ok) {
          throw new Error("서버 응답 오류");
        }

        const issueData = await issueResponse.json();
        const projectData = await projectResponse.json();

        setIssues(issueData);
        setProjects(projectData);
      } catch (err) {
        console.error("이슈 데이터 불러오기 실패:", err);
      }
    }

    loadData();
  }, []);
  useEffect(() => {
    let active = true;
    const events = new EventSource(`${API_BASE}/api/dong/issues/events`);

    events.onmessage = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/dong/issues`);
        if (!response.ok) throw new Error('서버 응답 오류');
        const latestIssues = await response.json();
        if (active) setIssues(latestIssues);
      } catch (err) {
        console.error('이슈 상태 갱신 실패:', err);
      }
    };

    return () => {
      active = false;
      events.close();
    };
  }, []);
  const value = {
    projects,
    issues,
    setIssues
  };

  return (
    <DongContext.Provider value={value}>
      {children}
    </DongContext.Provider>
  );
}
