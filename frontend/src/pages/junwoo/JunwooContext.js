import { createContext, useCallback, useContext, useState, useEffect } from 'react';

// 준우 페이지(대시보드·공지사항·프로젝트)가 같이 쓰는 데이터 상자
const JunwooContext = createContext(null);

export function useJunwoo() {
  return useContext(JunwooContext);
}

export function JunwooProvider({ children }) {


  const [info, setInfo] = useState([]);
  const [todo, setTodo] = useState([]);

  /* MySQL 프로젝트 전체 조회 */
  useEffect(() => {

    const loadProjects = async () => {

      try {

        const response = await fetch(
          'http://localhost:5000/api/projects'
        );

        if (!response.ok) {
          throw new Error('프로젝트 조회 실패');
        }

        const data = await response.json();

        setTodo(data);

      } catch (error) {

        console.error('프로젝트 불러오기 오류:', error);

      }

    };

    loadProjects();

  }, []);

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
  const addInfo = async (title, content, eventDate = null) => {

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
          employee_id,
          eventDate
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '공지사항 등록 실패');
    }

    // React 화면에도 등록한 공지사항 반영
    const newInfo = {
      id: data.id,
      title,
      content,
      date: new Date().toLocaleDateString('ko-KR'),
      author: employee_id,
      views: 0,
      eventDate,
      sortAt: Date.now() / 1000,
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
  const updateInfo = async (id, title, content, eventDate) => {

    const response = await fetch(
      `http://localhost:5000/api/notices/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          eventDate
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '공지사항 수정 실패');
    }


    /* React 화면에도 수정 내용 반영 */

    setInfo(prev =>
      prev.map(item =>
        item.id === id
          ? {
            ...item,
            title,
            content,
            eventDate: eventDate === undefined
              ? item.eventDate
              : eventDate,
            sortAt: Date.now() / 1000
          }
          : item
      ).sort((a, b) =>
        (Number(a.sortAt ?? 0) - Number(b.sortAt ?? 0)) ||
        (a.id - b.id)
      )
    );



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



  /* 프로젝트 등록 */
  const addTodo = async (
    title,
    content,
    startDate,
    endDate,
    status,
    priority
  ) => {

    // 테스트용 직원번호 (추후 로그인 정보 연결)
    const created_by = 1;

    const response = await fetch(
      'http://localhost:5000/api/projects',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          created_by,
          startDate,
          endDate,
          status,
          priority
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '프로젝트 등록 실패');
    }

    // React 화면에도 등록한 프로젝트 반영
    const newTodo = {
      id: data.id,
      title,
      content,
      date: new Date().toLocaleDateString('ko-KR'),
      author: created_by,
      views: 0,
      progress: 0,
      status,
      priority,
      startDate,
      endDate,
      sortAt: Date.now() / 1000,
    };

    setTodo(prev => [newTodo, ...prev]);

    return data.id;
  };




  /* 프로젝트 삭제 */
  const delTodo = async (id) => {

    const response = await fetch(
      `http://localhost:5000/api/projects/${id}`,
      {
        method: 'DELETE'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '프로젝트 삭제 실패');
    }

    // MySQL 삭제 성공 후 React 화면에서도 제거
    setTodo(prev =>
      prev.filter(item => item.id !== id)
    );

    return data;
  };




  /* 프로젝트 수정 */
  const updateTodo = async (
    id,
    title,
    content,
    status,
    priority,
    progress,
    startDate,
    endDate
  ) => {

    const response = await fetch(
      `http://localhost:5000/api/projects/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          content,
          status,
          priority,
          progress,
          startDate,
          endDate
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '프로젝트 수정 실패');
    }


    /* React 화면에도 수정 내용 반영 */

    setTodo(prev =>
      prev.map(item =>
        item.id === id
          ? {
            ...item,
            title,
            content,
            status: status ?? item.status,
            priority: priority ?? item.priority,
            progress: progress ?? item.progress,
            startDate: startDate === undefined
              ? item.startDate
              : startDate?.replace(/-/g, ".") ?? null,
            endDate: endDate === undefined
              ? item.endDate
              : endDate?.replace(/-/g, ".") ?? null,
            sortAt: Date.now() / 1000
          }
          : item
      ).sort((a, b) =>
        (Number(b.sortAt ?? 0) - Number(a.sortAt ?? 0)) ||
        (b.id - a.id)
      )
    );



    return data;
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



  /* 프로젝트 조회수 증가 */
  const viewTodo = useCallback(async (id) => {

    const response = await fetch(
      `http://localhost:5000/api/projects/${id}/views`,
      {
        method: 'PATCH'
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '조회수 증가 실패');
    }

    // React 화면에도 조회수 반영
    setTodo(prev => prev.map(item =>
      item.id === id
        ? { ...item, views: data.views }
        : item
    ));

    return data.views;

  }, []);


  const value = {
    info, todo,
    addInfo, delInfo, updateInfo, pinInfo,
    addTodo, delTodo, updateTodo,
    viewInfo, viewTodo
  };

  return <JunwooContext.Provider value={value}>{children}</JunwooContext.Provider>;
}
