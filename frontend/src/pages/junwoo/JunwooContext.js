import { API_BASE } from '../../shared/config';
import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";
import getLoginUser from "../woojin/getLoginUser";
import { connectProjectEvents } from "./projectEventsClient";

// 준우 페이지(대시보드·공지사항·프로젝트)가 같이 쓰는 데이터 상자
const JunwooContext = createContext(null);

export function useJunwoo() {
  return useContext(JunwooContext);
}

export function JunwooProvider({ children }) {

  const { pathname } = useLocation();


  // 여러 페이지가 공유하느 목록을 저장한다.
  // setInfo 또는 setTodo가 실행되면 이 데이터를 사용하는 화면도 갱신된다.
  const [info, setInfo] = useState([]);
  const [todo, setTodo] = useState([]);

  /* 프로젝트 조회 + SSE 변경 알림 */
  useEffect(() => {
    let disposed = false;
    let controller = null;

    const loadProjects = async () => {
      if (disposed) return;

      controller?.abort();

      // 각 요청의 취소 상태를 별도로 확인한다.
      const requestController = new AbortController();
      controller = requestController;

      try {
        const response = await fetch(
          `${API_BASE}/api/projects`,
          {
            signal: requestController.signal,
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error("프로젝트 조회 실패");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("프로젝트 목록 형식이 올바르지 않습니다.");
        }

        if (
          !disposed &&
          !requestController.signal.aborted
        ) {
          setTodo(data);
        }
      } catch (error) {
        if (
          !disposed &&
          error.name !== "AbortError"
        ) {
          console.error("프로젝트 불러오기 오류:", error);
        }
      }
    };

    // 화면 진입 시 기본 목록 조회
    loadProjects();

    const handleFocus = () => {
      loadProjects();
    };

    window.addEventListener("focus", handleFocus);

    // 기존에 자동 갱신하던 메인·프로젝트 목록에서 SSE 연결
    const disconnect =
      pathname === "/" || pathname === "/todo"
        ? connectProjectEvents(loadProjects)
        : () => { };

    return () => {
      disposed = true;

      disconnect();
      controller?.abort();

      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  /* 공지사항 조회: 화면 이동 및 창 복귀 시 최신 상태 반영 */
  useEffect(() => {
    let disposed = false;
    let controller = null;

    const loadInfo = async () => {
      if (controller) {
        controller.abort();
      }

      controller = new AbortController();

      try {
        const response = await fetch(
          `${API_BASE}/api/notices`,
          {
            signal: controller.signal,
            cache: "no-store"
          }
        );

        if (!response.ok) {
          throw new Error("공지사항 조회 실패");
        }

        const data = await response.json();

        if (!disposed) {
          // 기존 공유 배열 순서는 유지하고,
          // 각 화면에서 고정 여부에 따라 정렬한다.
          setInfo([...data].reverse());
        }
      } catch (error) {
        if (error.name !== "AbortError" && !disposed) {
          console.error("공지사항 조회 오류:", error);
        }
      }
    };

    const handleFocus = () => {
      loadInfo();
    };

    loadInfo();
    window.addEventListener("focus", handleFocus);

    return () => {
      disposed = true;

      if (controller) {
        controller.abort();
      }

      window.removeEventListener("focus", handleFocus);
    };
  }, [pathname]);

  /* 공지사항 등록 */
  const addInfo = async (title, content, eventDate = null) => {
    const loginUser = getLoginUser();
    const employee_id = Number(loginUser.id);

    if (
      loginUser.isDummy ||
      !Number.isSafeInteger(employee_id) ||
      employee_id <= 0
    ) {
      throw new Error("로그인 후 공지사항을 등록해주세요.");
    }

    const response = await fetch(
      `${API_BASE}/api/notices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
      throw new Error(data.message || "공지사항 등록 실패");
    }

    // 등록 직후 화면에도 작성자 이름을 표시
    const newInfo = {
      id: data.id,
      title,
      content,
      date: new Date().toLocaleDateString("ko-KR"),
      author: loginUser.name,
      employee_id,
      views: 0,
      isPinned: false,
      eventDate,
      sortAt: Date.now() / 1000
    };

    setInfo(prev => [...prev, newInfo]);

    return data.id;
  };


  /* 공지사항 삭제 */
  const delInfo = async (id) => {

    const response = await fetch(
      `${API_BASE}/api/notices/${id}`,
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
      `${API_BASE}/api/notices/${id}`,
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
      `${API_BASE}/api/notices/${id}/pin`,
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



  // 프로젝트를 바로 생성하지 않고 관리자에게 등록 요청을 보낸다.
  // 승인 전이므로 todo 목록에는 추가하지 않고 요청 번호만 반환한다.
  const addTodo = async (
    title,
    content,
    startDate,
    endDate,
    status,
    priority
  ) => {

    // 로그인한 직원 정보
    const user = getLoginUser();

    if (user.isDummy || !user.id) {
      throw new Error(
        "로그인 후 프로젝트 등록을 요청해주세요."
      );
    }

    const created_by = Number(user.id);


    // 프로젝트 등록 요청 API
    const response = await fetch(
      `${API_BASE}/api/project-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
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
      throw new Error(
        data.message || "프로젝트 등록 요청 실패"
      );
    }


    // 아직 승인 전이므로 React 프로젝트 목록에 추가하지 않음

    // 요청 번호 반환
    return data.requestId;
  };




  /* 프로젝트 삭제 */
  const delTodo = async (id) => {

    const response = await fetch(
      `${API_BASE}/api/projects/${id}`,
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
      `${API_BASE}/api/projects/${id}`,
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
      `${API_BASE}/api/notices/${id}/views`,
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
      `${API_BASE}/api/projects/${id}/views`,
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

  // 완료 요청 저장 후 공통 프로젝트 목록에도 반영
  const requestProjectCompletion = async (projectId, resolution) => {
    const token = localStorage.getItem("nexus_auth_token");

    if (!token) {
      throw new Error("로그아웃 후 다시 로그인해주세요.")
    }

    const response = await fetch(
      `${API_BASE}/api/projects/${projectId}/completion-request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resolution })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "완료 요청을 저장하지 못했습니다.");
    }

    setTodo(previous =>
      previous.map(project =>
        String(project.id) === String(data.projectId)
          ? { ...project, status: data.status }
          : project
      )
    );

    return data;

  };

  // 하위 화면에 공개할 데이터와 함수를 모은다.
  // useJunwoo()를 호출하면 이 객체에 담긴 값을 꺼낼 수 있다.
  const value = {
    info, todo,
    addInfo, delInfo, updateInfo, pinInfo,
    addTodo, delTodo, updateTodo,
    viewInfo, viewTodo,
    requestProjectCompletion
  };

  return <JunwooContext.Provider value={value}>{children}</JunwooContext.Provider>;
}
