import { createContext, useContext } from 'react';
import useAdminData from './useAdminData';
import useAdminProjects from './useAdminProjects';

const JonghoContext = createContext(null);

export function useJongho() {
  return useContext(JonghoContext);
}

export function JonghoProvider({ children }) {
  const { data, changeData, resetData } = useAdminData();
  const {
    projects,
    setProjects,
    resetProjects,
    createProject,
    updateProject,
    removeProject,
    projectError,
  } = useAdminProjects();

  function resetDemo() {
    if (!window.confirm('모든 연습 데이터를 초기화할까요?')) return;
    resetData();
    resetProjects();
  }

  const value = {
    data,
    changeData,
    projects,
    setProjects,
    resetDemo,
    createProject,
    updateProject,
    removeProject,
    projectError,
  };

  return <JonghoContext.Provider value={value}>{children}</JonghoContext.Provider>;
}
