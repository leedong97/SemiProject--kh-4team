// 준우: projects API  (메인 서버에서 prefix '/api/projects' 로 연결됩니다)
// 원본: backend-junwoo/server.js 의 해당 구간을 Router 로 옮긴 것 (내용 로직은 그대로)
const express = require('express');
const db = require('../../db');

const router = express.Router();

router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(`
            
SELECT
    p.project_id AS id,
    p.project_title AS title,
    p.project_content AS content,

    p.created_by AS authorId,
    COALESCE(a.employee_name, '직원 정보 없음') AS author,

    p.manager_id AS managerId,
    CASE
        WHEN p.manager_id IS NULL THEN '미지정'
        ELSE COALESCE(m.employee_name, '직원 정보 없음')
    END AS managerName,

    p.status,
    p.priority,
    p.project_progress AS progress,
    p.views,

    DATE_FORMAT(p.start_date, '%Y.%m.%d') AS startDate,
    DATE_FORMAT(p.end_date, '%Y.%m.%d') AS endDate,
    DATE_FORMAT(p.created_at, '%Y.%m.%d') AS date

FROM projects p

LEFT JOIN employees a
    ON p.created_by = a.employee_id

LEFT JOIN employees m
    ON p.manager_id = m.employee_id

ORDER BY p.project_id DESC

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
router.get('/:id', async (req, res) => {

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
    p.project_id AS id,
    p.project_title AS title,
    p.project_content AS content,

    p.created_by AS authorId,
    COALESCE(a.employee_name, '직원 정보 없음') AS author,

    p.manager_id AS managerId,
    CASE
        WHEN p.manager_id IS NULL THEN '미지정'
        ELSE COALESCE(m.employee_name, '직원 정보 없음')
    END AS managerName,

    p.status,
    p.priority,
    p.project_progress AS progress,
    p.views,

    DATE_FORMAT(p.start_date, '%Y.%m.%d') AS startDate,
    DATE_FORMAT(p.end_date, '%Y.%m.%d') AS endDate,
    DATE_FORMAT(p.created_at, '%Y.%m.%d') AS date,
    DATE_FORMAT(p.updated_at, '%Y.%m.%d %H:%i') AS updatedAt

FROM projects p

LEFT JOIN employees a
    ON p.created_by = a.employee_id

LEFT JOIN employees m
    ON p.manager_id = m.employee_id

WHERE p.project_id = ?

        `, [id]);


        if (rows.length === 0) {
            return res.status(404).json({
                message: '존재하지 않는 프로젝트입니다.'
            });
        }

        // 프로젝트 참여 직원 이름 조회
        const [memberRows] = await db.query(`
    SELECT
        e.employee_name AS name
    FROM project_members pm
    JOIN employees e
        ON pm.employee_id = e.employee_id
    WHERE pm.project_id = ?
    ORDER BY pm.employee_id ASC
`, [id]);

        // 기존 프로젝트 정보 + 참여 직원 명단 반환
        res.json({
            ...rows[0],
            memberNames: memberRows.map(member => member.name)
        });


    } catch (error) {

        console.error('프로젝트 상세 조회 오류:', error);

        res.status(500).json({
            message: '프로젝트 상세 조회 실패'
        });

    }

});


/* 프로젝트 조회수 증가 */
router.patch('/:id/views', async (req, res) => {

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
router.post('/', async (req, res) => {

    const {
        title,
        content,
        created_by,
        startDate,
        endDate,
        status,
        priority
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

    if (!["예정", "진행중", "완료", "보류"].includes(status)) {
        return res.status(400).json({
            message: "올바른 프로젝트 상태를 선택하세요."
        });
    }

    if (!["낮음", "보통", "높음"].includes(priority)) {
        return res.status(400).json({
            message: "올바른 우선순위를 선택하세요."
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
        status,
        priority,
        project_progress,
        views
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
`, [
            title.trim(),
            content.trim(),
            created_by,
            startDate,
            endDate,
            status,
            priority
        ]);


        res.status(201).json({
            message: '프로젝트 등록 완료.',
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
router.put('/:id', async (req, res) => {

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
router.delete('/:id', async (req, res) => {

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



module.exports = router;
