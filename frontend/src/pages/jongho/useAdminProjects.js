import { useEffect, useState } from 'react';
import { adminRequest } from './adminApi';

export default function useAdminProjects() {
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

    async function createProject(project) {
        await adminRequest('/projects', {
            method: 'POST',
            body: JSON.stringify(project),
        });
        await loadProjects();
    }

    async function updateProject(id, changes) {
        await adminRequest('/projects/' + id, {
            method: 'PATCH',
            body: JSON.stringify(changes),
        });
        await loadProjects();
    }

    async function updateProjectMembers(id, memberIds) {
        await adminRequest('/projects/' + id + '/members', {
            method: 'PUT',
            body: JSON.stringify({ memberIds }),
        });
        await loadProjects();
    }

    async function removeProject(id) {
        await adminRequest('/projects/' + id, { method: 'DELETE' });
        await loadProjects();
    }

    function setProjects(next) {
        setProjectsState((previous) => (
            typeof next === 'function' ? next(previous) : next
        ));
    }

    return {
        projects,
        setProjects,
        resetProjects: loadProjects,
        createProject,
        updateProject,
        updateProjectMembers,
        removeProject,
        projectError,
    };
}
