
const express = require('express');
const cors = require('cors');
const db = require('./db');

require('dotenv').config();

const app = express();

// React와 연결
app.use(cors({
    origin: 'http://localhost:3000'
}));

// JSON 데이터 사용
app.use(express.json());

// 기본 서버 확인
app.get('/', (req, res) => {
    res.send('COMAND ERP 서버 실행 중!');
});

// MySQL 연결 확인
app.get('/api/db-check', async (req, res) => {

    try {
        const [rows] = await db.query(
            'SELECT 1 AS connected'
        );

        res.json({
            message: 'MySQL 연결 성공!',
            connected: rows[0].connected === 1
        });

    } catch (error) {
        console.error('DB 연결 오류:', error);

        res.status(500).json({
            message: 'MySQL 연결 실패'
        });
    }

});

// 서버 실행
const PORT = process.env.PORT || 5000;



/* 대시보드 캘린더 통합 일정 조회 */
app.get('/api/dashboard/schedules', async (req, res) => {

    // 임시 직원번호 (추후 로그인 정보 연결)
    const employeeId = 1;

    try {

        /* 1. 직원 개인 일정 */
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


        /* 3. 프로젝트 종료일 */
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

        /* 4. 모든 일정 합치기 */
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
app.get('/api/notices', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                notice_id AS id,
                title,
                content,
                employee_id AS author,
                DATE_FORMAT(created_at, '%Y.%m.%d') AS date,
                views,
                is_pinned AS isPinned
                FROM notices
                ORDER BY COALESCE(updated_at, created_at) DESC, notice_id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error('공지사항 조회 오류:', error);

        res.status(500).json({
            message: '공지사항 조회 실패'
        });

    }

});



/* 공지사항 등록 */
app.post('/api/notices', async (req, res) => {

    const { title, content, employee_id, eventDate = null } = req.body;

    // 제목과 내용 공백 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 내용 글자 수 검사
    if (content.trim().length > 10000) {
        return res.status(400).json({
            message: '내용은 최대 10000자까지 입력할 수 있습니다.'
        });
    }


    /* 공지사항 행사일 검사 (선택사항) */
    if (eventDate !== null) {

        const date = new Date(`${eventDate}T00:00:00Z`);

        if (
            typeof eventDate !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== eventDate
        ) {
            return res.status(400).json({
                message: '올바른 행사일을 선택해주세요.'
            });
        }

    }


    try {


        const [result] = await db.query(
            `INSERT INTO notices (
            title,
            content,
            employee_id,
            event_date
            )
                VALUES (?, ?, ?, ?)`,
            [
                title.trim(),
                content.trim(),
                employee_id,
                eventDate
            ]
        );


        res.status(201).json({
            message: '공지사항 등록 성공!',
            id: result.insertId
        });

    } catch (error) {

        console.error('공지사항 등록 오류:', error);

        res.status(500).json({
            message: '공지사항 등록 실패'
        });

    }

});

/* 공지사항 상세 조회 */
app.get('/api/notices/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const [rows] = await db.query(`
            SELECT
                UNIX_TIMESTAMP(COALESCE(updated_at, created_at)) AS sortAt,
                notice_id AS id,
                title,
                content,
                DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
                employee_id AS author,
                DATE_FORMAT(created_at, '%Y.%m.%d') AS date,
                DATE_FORMAT(updated_at, '%Y.%m.%d %H:%i') AS updatedAt,
                views,
                is_pinned AS isPinned
            FROM notices
            WHERE notice_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error('공지사항 상세 조회 오류:', error);

        res.status(500).json({
            message: '공지사항 상세 조회 실패'
        });

    }

});



/* 공지사항 조회수 증가 */
app.patch('/api/notices/:id/views', async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    try {

        const [result] = await db.query(
            `UPDATE notices
             SET
                 views = COALESCE(views, 0) + 1,
                 updated_at = updated_at
             WHERE notice_id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        const [rows] = await db.query(
            'SELECT views FROM notices WHERE notice_id = ?',
            [id]
        );

        res.json({
            views: rows[0].views
        });

    } catch (error) {

        console.error('조회수 증가 오류:', error);

        res.status(500).json({
            message: '조회수 증가 실패'
        });

    }

});


/* 공지사항 삭제 */
app.delete('/api/notices/:id', async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    try {

        const [result] = await db.query(
            'DELETE FROM notices WHERE notice_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: '공지사항 삭제 성공!'
        });

    } catch (error) {

        console.error('공지사항 삭제 오류:', error);

        res.status(500).json({
            message: '공지사항 삭제 실패'
        });

    }

});


/* 공지사항 수정 */
app.put('/api/notices/:id', async (req, res) => {

    const id = Number(req.params.id);
    const { title, content, eventDate } = req.body;

    // 공지사항 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    // 제목과 내용 확인
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 내용 글자 수 검사
    if (content.trim().length > 10000) {
        return res.status(400).json({
            message: '내용은 최대 10000자까지 입력할 수 있습니다.'
        });
    }

    // 행사일 유효성 검사 (여기에 추가!)
    if (eventDate !== undefined && eventDate !== null) {
        const validDate =
            typeof eventDate === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(eventDate) &&
            !Number.isNaN(Date.parse(eventDate)) &&
            new Date(eventDate).toISOString().slice(0, 10) === eventDate;

        if (!validDate) {
            return res.status(400).json({
                message: "올바른 행사일을 선택해주세요."
            });
        }
    }

    try {


        const [result] = await db.query(`
            UPDATE notices
                SET
                title = ?,
                content = ?,
                event_date = CASE
                WHEN ? = 1 THEN ?
                ELSE event_date
                END,
                updated_at = NOW()
                WHERE notice_id = ?
        `, [
            title.trim(),
            content.trim(),
            eventDate !== undefined ? 1 : 0,
            eventDate ?? null,
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: '공지사항 수정 성공!',
            id: id
        });

    } catch (error) {

        console.error('공지사항 수정 오류:', error);

        res.status(500).json({
            message: '공지사항 수정 실패'
        });

    }

});


/* 공지사항 상단 고정 설정 */
app.patch('/api/notices/:id/pin', async (req, res) => {

    const id = Number(req.params.id);
    const { isPinned } = req.body;

    // 공지사항 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 공지사항 번호입니다.'
        });
    }

    // 고정 여부 확인
    if (typeof isPinned !== 'boolean') {
        return res.status(400).json({
            message: '고정 여부를 확인해주세요.'
        });
    }

    try {

        const [result] = await db.query(`
            UPDATE notices
            SET
                is_pinned = ?,
                updated_at = NOW()
            WHERE notice_id = ?
        `, [isPinned ? 1 : 0, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 공지사항입니다.'
            });
        }

        res.json({
            message: isPinned
                ? '공지사항 상단 고정 성공!'
                : '공지사항 상단 고정 해제!',
            id,
            isPinned
        });

    } catch (error) {

        console.error('공지사항 고정 오류:', error);

        res.status(500).json({
            message: '공지사항 고정 설정 실패'
        });

    }

});

/* 프로젝트 전체 조회 */
app.get('/api/projects', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                UNIX_TIMESTAMP(COALESCE(updated_at, created_at)) AS sortAt,
                project_id AS id,
                project_title AS title,
                project_content AS content,
                created_by AS author,
                manager_id AS managerId,
                status,
                priority,
                project_progress AS progress,
                views,
                DATE_FORMAT(start_date, '%Y.%m.%d') AS startDate,
                DATE_FORMAT(end_date, '%Y.%m.%d') AS endDate,
                DATE_FORMAT(created_at, '%Y.%m.%d') AS date
            FROM projects
            ORDER BY COALESCE(updated_at, created_at) DESC, project_id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error('프로젝트 조회 오류:', error);

        res.status(500).json({
            message: '프로젝트 조회 실패'
        });

    }

});


/* 프로젝트 상세 조회 */
app.get('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [rows] = await db.query(`
            SELECT
                project_id AS id,
                project_title AS title,
                project_content AS content,
                created_by AS author,
                manager_id AS managerId,
                status,
                priority,
                project_progress AS progress,
                views,
                DATE_FORMAT(start_date, '%Y.%m.%d') AS startDate,
                DATE_FORMAT(end_date, '%Y.%m.%d') AS endDate,
                DATE_FORMAT(created_at, '%Y.%m.%d') AS date,
                DATE_FORMAT(updated_at, '%Y.%m.%d %H:%i') AS updatedAt
            FROM projects
            WHERE project_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error('프로젝트 상세 조회 오류:', error);

        res.status(500).json({
            message: '프로젝트 상세 조회 실패'
        });

    }

});


/* 프로젝트 조회수 증가 */
app.patch('/api/projects/:id/views', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [result] = await db.query(`
            UPDATE projects
            SET
                views = COALESCE(views, 0) + 1,
                updated_at = updated_at
            WHERE project_id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        const [rows] = await db.query(
            'SELECT views FROM projects WHERE project_id = ?',
            [id]
        );

        res.json({
            views: rows[0].views
        });

    } catch (error) {

        console.error('프로젝트 조회수 증가 오류:', error);

        res.status(500).json({
            message: '프로젝트 조회수 증가 실패'
        });

    }

});


/* 프로젝트 등록 */
app.post('/api/projects', async (req, res) => {

    const {
        title,
        content,
        created_by,
        startDate,
        endDate
    } = req.body;

    // 제목과 내용 공백 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '프로젝트 제목과 내용을 입력하세요.'
        });
    }

    // 제목 글자 수 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 작성자 번호 검사
    if (
        !Number.isSafeInteger(created_by) ||
        created_by <= 0
    ) {
        return res.status(400).json({
            message: '올바른 작성자 번호가 필요합니다.'
        });
    }


    // 프로젝트 일정 검사
    if (
        typeof startDate !== 'string' ||
        typeof endDate !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
        return res.status(400).json({
            message: '프로젝트 시작일과 종료일을 선택해주세요.'
        });
    }

    // 날짜 순서 검사
    if (endDate < startDate) {
        return res.status(400).json({
            message: '종료일은 시작일보다 빠를 수 없습니다.'
        });
    }


    try {


        const [result] = await db.query(`
    INSERT INTO projects (
        project_title,
        project_content,
        created_by,
        start_date,
        end_date,
        project_progress,
        views
    )
    VALUES (?, ?, ?, ?, ?, 0, 0)
`, [
            title.trim(),
            content.trim(),
            created_by,
            startDate,
            endDate
        ]);


        res.status(201).json({
            message: '프로젝트 등록 성공!',
            id: result.insertId
        });

    } catch (error) {

        console.error('프로젝트 등록 오류:', error);

        res.status(500).json({
            message: '프로젝트 등록 실패'
        });

    }

});



/* 프로젝트 수정 */
app.put('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    const {
        title,
        content,
        status,
        priority,
        progress,
        startDate,
        endDate
    } = req.body;

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    // 제목과 내용 검사
    if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: '프로젝트 제목과 내용을 입력하세요.'
        });
    }

    // 제목 길이 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: '제목은 최대 200자까지 입력할 수 있습니다.'
        });
    }

    // 프로젝트 상태 검사
    const statusList = ['예정', '진행중', '완료', '보류'];

    if (
        status !== undefined &&
        !statusList.includes(status)
    ) {
        return res.status(400).json({
            message: '올바른 프로젝트 상태를 선택하세요.'
        });
    }

    // 우선순위 검사
    const priorityList = ['낮음', '보통', '높음'];

    if (
        priority !== undefined &&
        !priorityList.includes(priority)
    ) {
        return res.status(400).json({
            message: '올바른 우선순위를 선택하세요.'
        });
    }

    // 진행률 검사
    if (
        progress !== undefined &&
        (
            !Number.isInteger(progress) ||
            progress < 0 ||
            progress > 100
        )
    ) {
        return res.status(400).json({
            message: '진행률은 0~100 사이의 정수여야 합니다.'
        });
    }

    const validProjectDate = (value) =>
        value === undefined ||
        value === null ||
        (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(value) &&
            !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value
        );

    if (!validProjectDate(startDate) || !validProjectDate(endDate)) {
        return res.status(400).json({
            message: "올바른 프로젝트 날짜를 입력해주세요."
        });
    }

    if (startDate && endDate && endDate < startDate) {
        return res.status(400).json({
            message: "종료일은 시작일보다 빠를 수 없습니다."
        });
    }

    try {


        const [result] = await db.query(`
    UPDATE projects
    SET
        project_title = ?,
        project_content = ?,
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        project_progress = COALESCE(?, project_progress),
        start_date = CASE WHEN ? = 1 THEN ? ELSE start_date END,
        end_date = CASE WHEN ? = 1 THEN ? ELSE end_date END,
        updated_at = NOW()
    WHERE project_id = ?
`, [
            title.trim(),
            content.trim(),
            status ?? null,
            priority ?? null,
            progress ?? null,
            startDate !== undefined ? 1 : 0,
            startDate ?? null,
            endDate !== undefined ? 1 : 0,
            endDate ?? null,
            id
        ]);


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json({
            message: '프로젝트 수정 성공!',
            id
        });

    } catch (error) {

        console.error('프로젝트 수정 오류:', error);

        res.status(500).json({
            message: '프로젝트 수정 실패'
        });

    }

});



/* 프로젝트 삭제 */
app.delete('/api/projects/:id', async (req, res) => {

    const id = Number(req.params.id);

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

    try {

        const [result] = await db.query(
            'DELETE FROM projects WHERE project_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json({
            message: '프로젝트 삭제 성공!'
        });

    } catch (error) {

        console.error('프로젝트 삭제 오류:', error);

        // 다른 테이블에서 프로젝트를 참조하는 경우
        if (
            error.code === 'ER_ROW_IS_REFERENCED_2' ||
            error.code === 'ER_ROW_IS_REFERENCED'
        ) {
            return res.status(409).json({
                message: '참여자 또는 관련 데이터가 있어 프로젝트를 삭제할 수 없습니다.'
            });
        }

        res.status(500).json({
            message: '프로젝트 삭제 실패'
        });

    }

});


// 서버 실행
app.listen(PORT, () => {
    console.log(`서버 실행: http://localhost:${PORT}`);
});


