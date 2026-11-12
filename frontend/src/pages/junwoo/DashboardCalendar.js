import { API_BASE } from '../../shared/config';
import { useCallback, useEffect, useState } from 'react';

// 대시보드 일정 목록을 서버에서 가져오는 훅.
// 달력(점 표시)과 "오늘 일정" 목록이 같은 데이터를 함께 써요.
// 브라우저가 DB에 직접 접속하는 것은 아니고, 백엔드 API에 요청해요.
export function useDashboardSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSchedules = async () => {
      setLoading(true);
      setError('');

      try {
        // 로그인할 때 저장한 인증 토큰. 서버는 이 토큰으로 직원을 확인해요.
        const token = localStorage.getItem('nexus_auth_token');

        if (!token) {
          const e = new Error('로그인 정보가 없어 일정을 불러올 수 없어요. 다시 로그인해 주세요.');
          e.needsLogin = true;
          throw e;
        }

        const response = await fetch(`${API_BASE}/api/dashboard/schedules`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            const e = new Error('로그인이 만료되었어요. 다시 로그인해 주세요.');
            e.needsLogin = true;
            throw e;
          }
          if (response.status === 403) {
            throw new Error('이 계정으로는 일정을 볼 수 없어요. 관리자에게 문의해 주세요.');
          }
          throw new Error('일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('일정 데이터 형식이 올바르지 않아요.');
        }

        // projectId·noticeId 는 상세 페이지로 이동할 때 써요.
        // key 는 DB 번호가 없어서 날짜·시간·제목으로 만들어요.
        setSchedules(
          data.map((item, index) => ({
            key: `${item.date}-${item.time || ''}-${item.title}-${index}`,
            title: item.title,
            date: item.date,
            time: item.time || '',
            type: item.type,
            projectId: item.projectId ?? null,
            noticeId: item.noticeId ?? null,
          }))
        );
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSchedules([]);
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadSchedules();
    return () => controller.abort();
  }, [attempt]);

  return { schedules, loading, error, retry };
}
