import { createContext, useCallback, useContext, useState } from 'react';

// 준우 페이지(대시보드·공지사항·프로젝트)가 같이 쓰는 데이터 상자
const JunwooContext = createContext(null);

export function useJunwoo() {
  return useContext(JunwooContext);
}

export function JunwooProvider({ children }) {


  const [info, setInfo] = useState([]);
  const [todo, setTodo] = useState([]);

  const addInfo = (title, content) => {

    const newInfo = {
      id: Date.now(),
      title: title,
      content: content,
      date: new Date().toLocaleDateString('ko-KR'),
      author: '관리자',
      views: 0
    };

    setInfo(prev => [...prev, newInfo]);
  };

  const delInfo = (id) => {
    setInfo(prev => prev.filter(item => item.id !== id))
  }

  const addTodo = (title, content) => {

    const newTodo = {
      id: Date.now(),
      title: title,
      content: content,
      date: new Date().toLocaleDateString('ko-KR'),
      author: '관리자',
      views: 0
    };

    setTodo(prev => [...prev, newTodo]);
  };

  const delTodo = (id) => {
    setTodo(prev => prev.filter(item => item.id !== id));
  };

  // 공지사항 조회수 증가
  const viewInfo = useCallback((id) => {
    setInfo(prev => prev.map(item =>
      item.id === id
        ? { ...item, views: (item.views ?? 0) + 1 }
        : item
    ));
  }, []);

  // 프로젝트 조회수 증가
  const viewTodo = useCallback((id) => {
    setTodo(prev => prev.map(item =>
      item.id === id
        ? { ...item, views: (item.views ?? 0) + 1 }
        : item
    ));
  }, []);

  const value = { info, todo, addInfo, delInfo, addTodo, delTodo, viewInfo, viewTodo };

  return <JunwooContext.Provider value={value}>{children}</JunwooContext.Provider>;
}
