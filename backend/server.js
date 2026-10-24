
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
                ORDER BY notice_id DESC
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

    const { title, content, employee_id } = req.body;

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

    try {

        const [result] = await db.query(
            `INSERT INTO notices (title, content, employee_id)
             VALUES (?, ?, ?)`,
            [title.trim(), content.trim(), employee_id]
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
                notice_id AS id,
                title,
                content,
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
    const { title, content } = req.body;

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

    try {

        const [result] = await db.query(`
            UPDATE notices
            SET
                title = ?,
                content = ?,
                updated_at = NOW()
            WHERE notice_id = ?
        `, [title.trim(), content.trim(), id]);

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
                project_id AS id,
                title,
                content,
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
            ORDER BY project_id DESC
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
                title,
                content,
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

    const { title, content, created_by } = req.body;

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

    try {

        const [result] = await db.query(`
            INSERT INTO projects
                (title, content, created_by, project_progress, views)
            VALUES (?, ?, ?, 0, 0)
        `, [title.trim(), content.trim(), created_by]);

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
    const { title, content } = req.body;

    // 프로젝트 번호 확인
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            message: '잘못된 프로젝트 번호입니다.'
        });
    }

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

    try {

        const [result] = await db.query(`
            UPDATE projects
            SET
                title = ?,
                content = ?,
                updated_at = NOW()
            WHERE project_id = ?
        `, [title.trim(), content.trim(), id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        res.json({
            message: '프로젝트 수정 성공!',
            id: id
        });

    } catch (error) {

        console.error('프로젝트 수정 오류:', error);

        res.status(500).json({
            message: '프로젝트 수정 실패'
        });

    }

});


// 서버 실행
app.listen(PORT, () => {
    console.log(`서버 실행: http://localhost:${PORT}`);
});


