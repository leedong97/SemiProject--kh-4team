




import { createContext, useContext, useState } from 'react';

// 동협 페이지(이슈관리)가 같이 쓰는 데이터 상자
const DongContext = createContext(null);

export function useDong() {
  return useContext(DongContext);
}

export function DongProvider({ children }) {
  const [issues, setIssues] = useState([
    {
      id: 1,
      projectId: "P001",
      title: "로그인 오류",
      description: "로그인 버튼 클릭 시 오류 발생",
      reporter: "홍길동",
      status: "접수",
      createdAt: "2026-10-22"
    }
  ]);
  const projects = [
    { id: "P001", name: "KB국민은행" },
    { id: "P002", name: "삼성전자" },
    { id: "P003", name: "쿠팡" },
    { id: "P004", name: "서울대학교병원" },
    { id: "P005", name: "대한항공" },
    { id: "P006", name: "현대자동차" },
    { id: "P007", name: "CJ대한통운" },
    { id: "P008", name: "신세계백화점" },
    { id: "P009", name: "한국전력공사" },
    { id: "P010", name: "서울특별시" }
  ];

  const value = { projects, issues, setIssues };

  return <DongContext.Provider value={value}>{children}</DongContext.Provider>;
}
