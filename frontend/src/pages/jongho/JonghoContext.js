import { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE } from '../../shared/config';
import { buildCompletionRequests, getPendingProjectRequests, getQuoteRequests } from './adminApi';
import useAdminData from './useAdminData';
import useAdminProjects from './useAdminProjects';

const JonghoContext = createContext(null);

export function useJongho() {
  return useContext(JonghoContext);
}

export function JonghoProvider({ children }) {
  const { data, changeData, reloadData } = useAdminData();

  // 견적 요청: 관리자 모듈이 열려 있는 동안 한 번 연결해 두고, 변경 신호가 오면 목록을 다시 받는다
  const [quotes, setQuotes] = useState([]);

  // 알림(요청·이슈) 다시 받기 신호: 견적 변경 신호가 오거나 프로젝트 상태가 바뀌면 값이 바뀐다
  const [alertTick, setAlertTick] = useState(0);
  const refreshAlerts = () => setAlertTick((t) => t + 1);
  const loadQuotes = async () => {
    try {
      setQuotes(await getQuoteRequests());
    } catch (error) {
      // 목록 조회 실패는 화면을 막지 않는다 (다음 신호에서 다시 시도)
    }
  };

  useEffect(() => {
    let source = null;
    let retryTimer = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      const token = localStorage.getItem('nexus_auth_token') || '';
      if (!token) {
        retryTimer = setTimeout(connect, 2000);
        return;
      }
      source = new EventSource(
        `${API_BASE}/api/admin/quote-requests/events?token=${encodeURIComponent(token)}`
      );
      // 연결이 열리면(처음 신호 포함) 최신 목록을 받는다 → 연결 전에 생긴 변경도 맞춰진다
      source.onmessage = () => {
        loadQuotes();
        refreshAlerts();
      };
      source.onerror = () => {
        source.close();
        retryTimer = setTimeout(connect, 3000);
      };
    };

    loadQuotes();
    connect();
    return () => {
      closed = true;
      clearTimeout(retryTimer);
      if (source) source.close();
    };
  }, []);

  const {
    projects,
    setProjects,
    resetProjects,
    createProject,
    updateProject,
    updateProjectMembers,
    removeProject,
    projectError,
  } = useAdminProjects();

  // 완료 요청 목록: 프로젝트 목록과 요청 기록을 한 번씩만 받아 합친다 (알림과 프로젝트 화면이 같이 쓴다)
  const [completionRequests, setCompletionRequests] = useState([]);
  const loadCompletionRequests = async () => {
    const [projectRows, requestRows] = await Promise.all([
      resetProjects(),
      getPendingProjectRequests('완료').catch(() => []),
    ]);
    setCompletionRequests(buildCompletionRequests(requestRows, projectRows));
  };
  // 처음 열릴 때 + 변경 신호(SSE 연결 포함, refreshAlerts)가 올 때 다시 받는다
  useEffect(() => {
    loadCompletionRequests();
  }, [alertTick]);

  // 관리자 화면에 들어올 때 호출: 로그인 뒤에도 데이터가 바로 채워지도록 전부 다시 받는다
  const reloadAdminData = async () => {
    await Promise.all([reloadData(), resetProjects(), loadQuotes()]);
  };

  const value = {
    data,
    changeData,
    reloadAdminData,
    quotes,
    loadQuotes,
    projects,
    setProjects,
    resetProjects,
    createProject,
    updateProject,
    updateProjectMembers,
    removeProject,
    projectError,
    alertTick,
    refreshAlerts,
    completionRequests,
  };

  return <JonghoContext.Provider value={value}>{children}</JonghoContext.Provider>;
}