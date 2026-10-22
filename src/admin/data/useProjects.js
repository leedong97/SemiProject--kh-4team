import { useState } from "react";
import { initialProjects } from "./mockData";
const KEY = "nexus_merged_projects_v1";
export default function useProjects() {
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
