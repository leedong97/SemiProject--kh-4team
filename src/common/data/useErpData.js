import { useState } from "react";
import { initialData } from "./initialData";

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

export default function useErpData() {
    const [data, setData] = useState(readData);

    // 모든 변경은 이 함수 하나로 처리해 데이터와 감사 로그를 함께 저장합니다.
    function changeData(action, updater) {
        setData(previous => {
            const next = updater(previous);
            const logs = [{ id: Date.now() + Math.random(), action, at: new Date().toLocaleString("ko-KR") }, ...previous.logs].slice(0, 100);
            const result = { ...next, logs };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
            return result;
        });
    }

    function resetData() {
        localStorage.removeItem(STORAGE_KEY);
        setData(initialData);
    }

    return { data, changeData, resetData };
}
