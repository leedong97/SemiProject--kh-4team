import { createContext, useContext } from 'react';
import useErpData from './useErpData';
import useProjects from './admin/data/useProjects';

// 종호 페이지(관리자)가 같이 쓰는 데이터 상자
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
