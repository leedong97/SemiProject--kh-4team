
import { API_BASE } from '../../shared/config';
import React, { useEffect, useState } from 'react';
import Calendar from './Calendar';

function DashboardCalendar() {

    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    /* MySQL 일정 조회 */
    useEffect(() => {

        const controller = new AbortController();

        const loadSchedules = async () => {

            try {
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

                // Calendar.js에 전달할 데이터

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
