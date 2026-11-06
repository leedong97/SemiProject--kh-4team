// 준우: dashboard API  (메인 서버에서 prefix '/api/dashboard' 로 연결됩니다)
// 원본: backend-junwoo/server.js 의 해당 구간을 Router 로 옮긴 것 (내용 로직은 그대로)
const { requireAuth } = require('../../middleware/session');
const express = require('express');
const db = require('../../db');

const router = express.Router();

// GET /api/dashboard/schedules
// requireAuth가 인증을 통과시킨 뒤 일정 조회 함수를 실행한다
router.get('/schedules', requireAuth, async (req, res) => {

    // 로그인 인증을 통과한 직원의 번호
    const employeeId = req.user.employee_id;

    try {

        // 현재 코드는 직원별 참여 여부로 제한하지 않고
        // 시작일이 있는 프로젝트의 일정을 조회한다
        const [scheduleRows] = await db.query(`
            SELECT
                schedule_title AS title,
                DATE_FORMAT(
                    schedule_start_date,
                    '%Y-%m-%d'
                ) AS date,
                COALESCE(
                    TIME_FORMAT(schedule_time, '%H:%i'),
                    ''
                ) AS time,
                schedule_type AS type
            FROM schedules
            WHERE employee_id = ?
        `, [employeeId]);


        /* 2. 프로젝트 시작일 */
        const [projectStartRows] = await db.query(`
            SELECT
            project_id AS projectId,
                CASE
                    WHEN start_date = end_date
                    THEN CONCAT('[프로젝트] ', project_title)
                    ELSE CONCAT('[프로젝트 시작] ', project_title)
                END AS title,

                DATE_FORMAT(
                    start_date,
                    '%Y-%m-%d'
                ) AS date,

                '' AS time,
                '프로젝트' AS type

            FROM projects
            WHERE start_date IS NOT NULL
        `);


        // 시작일과 종료일이 같은 프로젝트는 시작일 조회에서 이미 포함되므로
        // 종료 일정으로 다시 표시하지 않는다
        const [projectEndRows] = await db.query(`
            SELECT
            project_id AS projectId,
                CONCAT('[프로젝트 종료] ', project_title) AS title,

                DATE_FORMAT(
                    end_date,
                    '%Y-%m-%d'
                ) AS date,

                '' AS time,
                '프로젝트' AS type

            FROM projects
            WHERE end_date IS NOT NULL
            AND (
                start_date IS NULL
                OR end_date <> start_date
            )
        `);


        /* 공지사항 행사 일정 */
        const [noticeRows] = await db.query(`
    SELECT
        notice_id AS noticeId,
        CONCAT('[공지사항] ', title) AS title,
        DATE_FORMAT(event_date, '%Y-%m-%d') AS date,
        '' AS time,
        '공지사항' AS type
    FROM notices
    WHERE event_date IS NOT NULL
`);

        console.log('MySQL 공지사항 일정:', noticeRows);

        // 개인 일정, 프로젝트 시작.종료, 공지 행사 일정을
        // 하나의 배열로 합쳐 프론트엔드에 전달할 준비를 한다.
        const allSchedules = [
            ...scheduleRows,
            ...projectStartRows,
            ...projectEndRows,
            ...noticeRows
        ];


        /* 5. 날짜 및 시간순 정렬 */
        allSchedules.sort((a, b) => {

            const dateCompare = a.date.localeCompare(b.date);

            if (dateCompare !== 0) {
                return dateCompare;
            }

            return a.time.localeCompare(b.time);

        });


        res.json(allSchedules);

    } catch (error) {

        console.error('통합 캘린더 조회 오류:', error);

        res.status(500).json({
            message: '캘린더 일정을 불러오지 못했습니다.'
        });

    }

});



/* 공지사항 전체 조회 */

module.exports = router;
