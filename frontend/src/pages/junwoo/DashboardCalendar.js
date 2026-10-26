
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

                const response = await fetch(
                    'http://localhost:5000/api/dashboard/schedules',
                    {
                        signal: controller.signal,
                        cache: 'no-store'
                    }
                );

                if (!response.ok) {
                    throw new Error('일정 조회 실패');
                }

                const data = await response.json();

                console.log(
                    "공지사항 일정:",
                    data.filter(item => item.type === "공지사항")
                );

                if (!Array.isArray(data)) {
                    throw new Error('일정 데이터 형식이 올바르지 않습니다.');
                }

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
                    setError('일정을 불러오지 못했습니다.');
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
