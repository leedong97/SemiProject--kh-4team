// 준우: projects API  (메인 서버에서 prefix '/api/projects' 로 연결됩니다)
// 원본: backend-junwoo/server.js 의 해당 구간을 Router 로 옮긴 것 (내용 로직은 그대로)
const express = require('express');
const db = require('../../db');
const { requireAuth } = require("../../middleware/session");
const { createNotificationForManagers } = require("../../notify");

const router = express.Router();

router.get('/', async (req, res) => {

    try {

        const [rows] = await db.query(`
            
SELECT
    p.project_id AS id,
    p.project_title AS title,
    p.project_content AS content,
     c.customer_name AS customerName,

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

LEFT JOIN customers c
    ON p.customer_id = c.customer_id

WHERE p.manager_id IS NOT NULL

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

router.post("/:id/completion-request", requireAuth, async (req, res) => {
    const projectId = Number(req.params.id);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        return res.status(400).json({
            message: "올바른 프로젝트 번호가 아닙니다."
        });
    }

    try {
        // 담당자 확인과 상태 변경을 한 번의 SQL로 처리
        const [result] = await db.query(
            `UPDATE projects
            SET status = "완료 요청", updated_at = NOW()
            WHERE project_id = ?
                AND manager_id = ?
                AND status = "진행중"`,
            [projectId, req.user.employee_id]
        );

        if (result.affectedRows !== 1) {
            return res.status(409).json({
                message:
                    "담당 중인 진행중 프로젝트만 완료 요청할 수 있습니다." +
                    "이미 요청되었거나 상태가 변경됐는지 확인해주세요."
            });
        }

        // 알림: 관리자에게 프로젝트 완료 요청을 알려요 (요청한 본인이 관리자면 제외)
        try {
            const [info] = await db.query("SELECT project_title FROM projects WHERE project_id = ?", [projectId]);
            await createNotificationForManagers(
                "프로젝트",
                '프로젝트 "' + (info[0] ? info[0].project_title : projectId) + '"의 완료 요청이 들어왔어요.',
                null,
                [req.user.employee_id]
            );
        } catch (notifyError) {
            console.error("완료 요청 알림 오류:", notifyError.message);
        }

        res.json({
            projectId,
            status: "완료 요청",
            message: "완료 요청이 접수되었습니다."
        });

    } catch (error) {

        console.error("프로젝트 완료 요청 실패:", error);

        res.status(500).json({
            message: "완료 요청을 저장하지 못했습니다."
        });

    }

});

module.exports = router;
