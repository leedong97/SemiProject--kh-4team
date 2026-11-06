
import { API_BASE } from '../../shared/config';
import React, { useEffect, useState } from 'react';
import Calendar from './Calendar';

function DashboardCalendar() {

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 백엔드 API에 일정 목록을 요청한다.
    // 브라우저가 MySQL에 직접 접속하는 것은 아니다.
    useEffect(() => {

        const controller = new AbortController();

        const loadSchedules = async () => {

            try {

                // 로그인할 때 저장한 인증 토큰을 가져온다.
                // 서버는 이 토큰을 검증하여 요청한 직원이 누구인지 확인한다.
                const token = localStorage.getItem('nexus_auth_token');

                if (!token) {
                    throw new Error('로그아웃 후 다시 로그인해주세요.');
                }

                const response = await fetch(
                    `${API_BASE}/api/dashboard/schedules`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        signal: controller.signal,
                        cache: 'no-store'
                    }
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.');
                    }
                    if (response.status === 403) {
                        throw new Error('사용할 수 없는 계정입니다.');
                    }
                    throw new Error('일정 조회 실패');
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error('일정 데이터 형식이 올바르지 않습니다.');
                }

                console.log(
                    "공지사항 일정:",
                    data.filter(item => item.type === "공지사항")
                );

                // 서버 응답을 Calendar에서 사용할 일정 객체로 정리한다.
                // projectId와 noticeId는 상세 페이지로 이동할 때 사용한다.
                // index + 1로 만든 id는 DB의 실제 일정 번호가 아니다.
                const scheduleList = data.map((item, index) => ({
                    id: index + 1,
                    title: item.title,
                    date: item.date,
                    time: item.time || '',
                    type: item.type,
                    projectId: item.projectId ?? null,
                    noticeId: item.noticeId ?? null
                }));


                console.log('캘린더 일정:', scheduleList);

                setSchedules(scheduleList);

            } catch (error) {

                if (error.name !== 'AbortError') {
                    console.error('일정 조회 오류:', error);
                    setSchedules([]);
                    setError(error.message || '일정을 불러오지 못했습니다.');
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }

            }

        };

        loadSchedules();

        // 컴포넌트가 사라질 때 진행 중인 조회를 취소한다.
        return () => controller.abort();

    }, []);

    return (
        <>
            <Calendar schedules={schedules} />

            {loading && (
                <p>일정을 불러오는 중입니다...</p>
            )}

            {error && (
                <p>{error}</p>
            )}
        </>
    );

}

export default DashboardCalendar;
