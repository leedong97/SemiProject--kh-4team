import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../shared/config";
import getLoginUser from "../woojin/getLoginUser";
import { useJunwoo } from "./JunwooContext";
import "../dong/IssueCompletion.css";

function ProjectCompletion() {
    const user = getLoginUser();

    // 기존 완료 요청 함수를 그대로 사용
    const { requestProjectCompletion } = useJunwoo();

    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [loadError, setLoadError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [message, setMessage] = useState("");

    const requestRef = useRef(null);
    const savingRef = useRef(false);

    // 프로젝트를 조회하고 본인이 담당자인 프로젝트만 보관
    const loadProjects = useCallback(async () => {
        requestRef.current?.abort();

        const controller = new AbortController();
        requestRef.current = controller;

        setLoading(true);
        setLoadError("");

        try {
            if (user.isDummy || user.id == null) {
                throw new Error("로그인 후 이용해주세요.");
            }

            const response = await fetch(
                `${API_BASE}/api/projects`,
                {
                    signal: controller.signal,
                    cache: "no-store"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "프로젝트 조회에 실패했습니다."
                );
            }

            if (!Array.isArray(data)) {
                throw new Error("프로젝트 데이터 형식이 올바르지 않습니다.");
            }

            if (controller.signal.aborted) return;

            const myProjects = data.filter(project =>
                project.managerId != null &&
                String(project.managerId) === String(user.id)
            );

            setProjects(myProjects);

            // 새로고침 후 더 이상 신청할 수 없는 선택값은 해제
            setProjectId(previous =>
                myProjects.some(project =>
                    String(project.id) === previous &&
                    project.status === "진행중"
                )
                    ? previous
                    : ""
            );
        } catch (error) {
            if (!controller.signal.aborted) {
                setLoadError(error.message);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }
    }, [user.id, user.isDummy]);

    useEffect(() => {
        loadProjects();

        return () => {
            requestRef.current?.abort();
        };
    }, [loadProjects]);

    // 기존 서버 규칙에 맞춰 진행중인 담당 프로젝트만 선택 가능
    const availableProjects = projects.filter(
        project => project.status === "진행중"
    );

    const selectedProject = availableProjects.find(
        project => String(project.id) === projectId
    );

    async function handleSubmit(event) {
        event.preventDefault();

        if (savingRef.current || !selectedProject) return;

        if (!window.confirm(
            `"${selectedProject.title}" 프로젝트의 완료 승인을 요청할까요?`
        )) {
            return;
        }

        savingRef.current = true;
        setSaving(true);
        setSubmitError("");
        setMessage("");

        try {
            const data = await requestProjectCompletion(
                selectedProject.id
            );

            // 성공한 프로젝트는 선택 목록에서 제외
            setProjects(previous =>
                previous.map(project =>
                    String(project.id) === String(data.projectId)
                        ? { ...project, status: data.status }
                        : project
                )
            );

            setProjectId("");

            setMessage(
                `"${selectedProject.title}" 완료 요청이 접수되었습니다. 관리자 승인을 기다려주세요.`
            );
        } catch (error) {
            setSubmitError(
                error.message || "완료 요청에 실패했습니다."
            );
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    }

    return (
        <section className="issue-completion">
            <div className="issue-completion-heading">
                <div>
                    <h2>프로젝트 완료 요청</h2>
                </div>

                <button
                    type="button"
                    onClick={loadProjects}
                    disabled={loading || saving}
                >
                    새로고침
                </button>
            </div>

            {loading && (
                <p role="status">
                    담당 프로젝트를 불러오는 중입니다.
                </p>
            )}

            {(loadError || submitError) && (
                <p
                    role="alert"
                    className="issue-completion-error"
                >
                    {loadError || submitError}
                </p>
            )}

            {message && (
                <p role="status">{message}</p>
            )}

            <form
                className="issue-completion-form"
                onSubmit={handleSubmit}
            >
                <label>
                    요청자
                    <input
                        readOnly
                        value={
                            user.isDummy
                                ? "로그인이 필요합니다"
                                : `${user.name} (${user.empNo || user.id})`
                        }
                    />
                </label>

                <label>
                    완료 요청할 프로젝트
                    <select
                        required
                        value={projectId}
                        disabled={
                            loading ||
                            saving ||
                            Boolean(loadError)
                        }
                        onChange={event => {
                            setProjectId(event.target.value);
                            setSubmitError("");
                            setMessage("");
                        }}
                    >
                        <option value="">
                            프로젝트를 선택해주세요
                        </option>

                        {availableProjects.map(project => (
                            <option
                                key={project.id}
                                value={project.id}
                            >
                                {project.title}
                            </option>
                        ))}
                    </select>
                </label>

                {!loading &&
                    !loadError &&
                    availableProjects.length === 0 && (
                        <p>
                            완료 요청할 수 있는 프로젝트가 없습니다.
                            담당 중인 진행중 프로젝트만 표시됩니다.
                        </p>
                    )}

                {selectedProject && (
                    <div className="issue-completion-item">
                        <h3>선택한 프로젝트</h3>

                        <p>프로젝트명: {selectedProject.title}</p>
                        <p>상태: {selectedProject.status}</p>
                        <p>
                            진행률: {selectedProject.progress ?? 0}%
                        </p>
                        <p>
                            기간: {selectedProject.startDate || "미정"}
                            {" ~ "}
                            {selectedProject.endDate || "미정"}
                        </p>
                    </div>
                )}

                <div className="issue-completion-actions">
                    <button
                        type="submit"
                        disabled={
                            loading ||
                            saving ||
                            Boolean(loadError) ||
                            !selectedProject
                        }
                    >
                        {saving ? "요청 중..." : "완료 요청 제출"}
                    </button>

                    <Link to="/todo">
                        프로젝트 목록으로
                    </Link>
                </div>
            </form>
        </section>
    );
}

export default ProjectCompletion;