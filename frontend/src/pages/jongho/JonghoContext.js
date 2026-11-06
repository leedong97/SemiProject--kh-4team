import { createContext, useContext } from 'react';
import useAdminData from './useAdminData';
import useAdminProjects from './useAdminProjects';

const JonghoContext = createContext(null);

export function useJongho() {
    return useContext(JonghoContext);
}

export function JonghoProvider({ children }) {
    const { data, changeData } = useAdminData();
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

    const value = {
        data,
        changeData,
        projects,
        setProjects,
        resetProjects,
        createProject,
        updateProject,
        updateProjectMembers,
        removeProject,
        projectError,
    };

    return <JonghoContext.Provider value={value}>{children}</JonghoContext.Provider>;
}