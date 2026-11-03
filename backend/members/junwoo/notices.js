// 준우: notices API  (메인 서버에서 prefix '/api/notices' 로 연결됩니다)
// 원본: backend-junwoo/server.js 의 해당 구간을 Router 로 옮긴 것 (내용 로직은 그대로)
const express = require('express');
const db = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                n.notice_id AS id,
                n.title,
                n.content,
                COALESCE(e.employee_name, '알 수 없음') AS author,
                DATE_FORMAT(n.created_at, '%Y.%m.%d') AS date,
                n.views,
                n.is_pinned AS isPinned
            FROM notices n
            LEFT JOIN employees e
                ON n.employee_id = e.employee_id
            ORDER BY n.notice_id DESC
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
router.post('/', async (req, res) => {

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
router.get('/:id', async (req, res) => {

    const { id } = req.params;

    try {

        const [rows] = await db.query(`
            SELECT
                n.notice_id AS id,
                n.title,
                n.content,
                COALESCE(e.employee_name, '알 수 없음') AS author,
                DATE_FORMAT(n.created_at, '%Y.%m.%d') AS date,
                DATE_FORMAT(n.updated_at, '%Y.%m.%d %H:%i') AS updatedAt,
                n.views,
                n.is_pinned AS isPinned
            FROM notices n
            LEFT JOIN employees e
                ON n.employee_id = e.employee_id
            WHERE n.notice_id = ?
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
router.patch('/:id/views', async (req, res) => {

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
router.delete('/:id', async (req, res) => {

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
router.put('/:id', async (req, res) => {

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
router.patch('/:id/pin', async (req, res) => {

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

module.exports = router;
