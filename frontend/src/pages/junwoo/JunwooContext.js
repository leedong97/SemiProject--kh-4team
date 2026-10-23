import { createContext, useCallback, useContext, useState, useEffect } from 'react';

// 준우 페이지(대시보드·공지사항·프로젝트)가 같이 쓰는 데이터 상자
const JunwooContext = createContext(null);

export function useJunwoo() {
  return useContext(JunwooContext);
}

export function JunwooProvider({ children }) {


  const [info, setInfo] = useState([]);
  const [todo, setTodo] = useState([]);


  /* MySQL 공지사항 전체 조회 */
  useEffect(() => {

    const loadInfo = async () => {

      try {

        const response = await fetch(
          'http://localhost:5000/api/notices'
        );

        if (!response.ok) {
          throw new Error('공지사항 조회 실패');
        }

        const data = await response.json();

        setInfo([...data].reverse());

      } catch (error) {
        console.error('공지사항 조회 오류:', error);
      }

    };

    loadInfo();

  }, []);



  /* 공지사항 등록 */
  const addInfo = async (title, content) => {

    // 테스트용 직원번호
    const employee_id = 1;

    const response = await fetch(
      'http://localhost:5000/api/notices',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          employee_id
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '공지사항 등록 실패');
    }

    const newInfo = {
      id: data.id,
      title,
      content,
      date: new Date().toLocaleDateString('ko-KR'),
      author: employee_id,
      views: 0
    };

    setInfo(prev => [...prev, newInfo]);

    return data.id;
  };



  /* 공지사항 삭제 */
  const delInfo = async (id) => {

    const response = await fetch(
      `http://localhost:5000/api/notices/${id}`,
      {
        method: 'DELETE'
      }
    );

    if (!response.ok) {
      throw new Error('공지사항 삭제 실패');
    }

    setInfo(prev =>
      prev.filter(item => item.id !== id)
    );

  };



  /* 공지사항 수정 */
  const updateInfo = async (id, title, content) => {

    const response = await fetch(
      `http://localhost:5000/api/notices/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '공지사항 수정 실패');
    }

    // React 화면에도 수정 내용 반영
    setInfo(prev => prev.map(item =>
      item.id === id
        ? { ...item, title, content }
        : item
    ));

    return data;
  };


  /* 공지사항 상단 고정 */
  const pinInfo = async (id, isPinned) => {

    const response = await fetch(
      `http://localhost:5000/api/notices/${id}/pin`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPinned
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '공지사항 고정 실패');
    }

    // React 화면에도 고정 상태 반영
    setInfo(prev => prev.map(item =>
      item.id === id
        ? { ...item, isPinned: isPinned ? 1 : 0 }
        : item
    ));

    return data;
  };

  // 프로젝트 등록
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

    return newTodo.id;
  };

  const delTodo = (id) => {
    setTodo(prev => prev.filter(item => item.id !== id));
  };


  /* 공지사항 조회수 증가 */
  const viewInfo = useCallback(async (id) => {

    const response = await fetch(
      `http://localhost:5000/api/notices/${id}/views`,
      {
        method: 'PATCH'
      }
    );

    if (!response.ok) {
      throw new Error('조회수 증가 실패');
    }

    const data = await response.json();

    setInfo(prev => prev.map(item =>
      item.id === id
        ? { ...item, views: data.views }
        : item
    ));

    return data.views;

  }, []);


  // 프로젝트 조회수 증가
  const viewTodo = useCallback((id) => {
    setTodo(prev => prev.map(item =>
      item.id === id
        ? { ...item, views: (item.views ?? 0) + 1 }
        : item
    ));
  }, []);

  const value = { info, todo, addInfo, delInfo, updateInfo, pinInfo, addTodo, delTodo, viewInfo, viewTodo };

  return <JunwooContext.Provider value={value}>{children}</JunwooContext.Provider>;
}
