import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getNotices, createNotice, editNotice, deleteNotice, increaseNoticeViews } from "./noticeApi";

const JunwooContext = createContext(null);

export function useJunwoo() {
    return useContext(JunwooContext);
}

export function JunwooProvider({ children }) {
    const [info, setInfo] = useState([]);
    const [todo, setTodo] = useState([]);
    const [noticeLoading, setNoticeLoading] = useState(true);
    const [noticeError, setNoticeError] = useState("");

    // 서버에서 공지사항을 다시 가져오는 함수
    const loadInfo = useCallback(async () => {
        try {
            const data = await getNotices();
            setInfo(data);
            setNoticeError("");
        } catch (error) {
            setNoticeError(error.message);
            throw error;
        } finally {
            setNoticeLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInfo().catch(error => console.error("공지사항 초기 조회 실패:", error));
    }, [loadInfo]);

    const addInfo = async (title, content, important = false, employeeId) => {
        await createNotice(title, content, important, employeeId);
        await loadInfo();
    };

    const updateInfo = async (id, title, content, important) => {
        await editNotice(id, title, content, important);
        await loadInfo();
    };

    const pinInfo = async (id) => {
        const item = info.find(item => item.id === id);
        if (!item) throw new Error("공지사항을 찾을 수 없습니다.");
        await editNotice(id, item.title, item.content, !Boolean(item.important));
        await loadInfo();
    };

    const delInfo = async (id) => {
        await deleteNotice(id);
        await loadInfo();
    };

    // 기존 프로젝트 기능은 변경하지 않음
    const addTodo = (title, content) => {
        const newTodo = {
            id: Date.now(), title, content,
            date: new Date().toLocaleDateString("ko-KR"),
            author: "관리자", views: 0
        };
        setTodo(prev => [...prev, newTodo]);
    };

    const delTodo = (id) => {
        setTodo(prev => prev.filter(item => item.id !== id));
    };

    const viewInfo = useCallback(async (id) => {
        try {
            await increaseNoticeViews(id);
            await loadInfo();
        } catch (error) {
            console.error("공지사항 조회수 증가 실패:", error);
        }
    }, [loadInfo]);

    const viewTodo = useCallback((id) => {
        setTodo(prev => prev.map(item =>
            item.id === id ? { ...item, views: (item.views ?? 0) + 1 } : item
        ));
    }, []);

    const value = {
        info, todo, noticeLoading, noticeError, loadInfo,
        addInfo, updateInfo, pinInfo, delInfo,
        addTodo, delTodo, viewInfo, viewTodo
    };

    return <JunwooContext.Provider value={value}>{children}</JunwooContext.Provider>;
}
