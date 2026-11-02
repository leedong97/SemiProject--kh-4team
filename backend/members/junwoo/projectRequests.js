// 프로젝트 등록 요청 API

const express = require("express");
const db = require("../../db");

const router = express.Router();

// ===================================
// 프로젝트 등록 요청 목록 조회
// ===================================

router.get("/", async function (req, res) {
    const requestStatus = req.query.requestStatus;

    // 허용된 요청 상태인지 검사
    if (
        requestStatus !== "대기" &&
        requestStatus !== "승인" &&
        requestStatus !== "반려"
    ) {
        return res.status(400).json({
            message: "요청 상태를 확인해주세요."
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT
                r.request_id AS requestId,
                r.title,
                r.content,
                r.requested_by AS authorId,

                COALESCE(
                    e.employee_name,
                    '직원 정보 없음'
                ) AS author,

                r.request_status AS requestStatus,
                r.project_status AS projectStatus,
                r.priority,

                DATE_FORMAT(
                    r.created_at,
                    '%Y.%m.%d'
                ) AS date,

                DATE_FORMAT(
                    r.start_date,
                    '%Y.%m.%d'
                ) AS startDate,

                DATE_FORMAT(
                    r.end_date,
                    '%Y.%m.%d'
                ) AS endDate,

                p.project_id AS approvedProjectId

             FROM project_requests r

             LEFT JOIN employees e
                ON r.requested_by = e.employee_id

             LEFT JOIN projects p
                ON r.approved_project_id = p.project_id

             WHERE r.request_status = ?

             ORDER BY r.created_at DESC, r.request_id DESC`,
            [requestStatus]
        );

        res.json(rows);
    } catch (error) {
        console.error("프로젝트 요청 목록 조회 오류:", error);

        res.status(500).json({
            message: "프로젝트 요청 목록을 불러오지 못했습니다."
        });
    }
});

// ===================================
// 프로젝트 등록 요청 상세 조회
// ===================================

router.get("/:id", async function (req, res) {
    const requestId = Number(req.params.id);

    if (
        !Number.isSafeInteger(requestId) ||
        requestId < 1
    ) {
        return res.status(400).json({
            message: "요청 번호를 확인해주세요."
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT
                r.request_id AS requestId,
                r.title,
                r.content,

                r.requested_by AS authorId,
                COALESCE(
                    author.employee_name,
                    '직원 정보 없음'
                ) AS author,

                r.request_status AS requestStatus,
                r.project_status AS projectStatus,
                r.priority,

                DATE_FORMAT(
                    r.start_date,
                    '%Y.%m.%d'
                ) AS startDate,

                DATE_FORMAT(
                    r.end_date,
                    '%Y.%m.%d'
                ) AS endDate,

                DATE_FORMAT(
                    r.created_at,
                    '%Y.%m.%d %H:%i'
                ) AS createdAt,

                processor.employee_name AS processedBy,

                DATE_FORMAT(
                    r.processed_at,
                    '%Y.%m.%d %H:%i'
                ) AS processedAt,

                p.project_id AS approvedProjectId

             FROM project_requests r

             LEFT JOIN employees author
                ON r.requested_by = author.employee_id

             LEFT JOIN employees processor
                ON r.processed_by = processor.employee_id

             LEFT JOIN projects p
                ON r.approved_project_id = p.project_id

             WHERE r.request_id = ?`,
            [requestId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "등록 요청을 찾을 수 없습니다."
            });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error("프로젝트 요청 상세 조회 오류:", error);

        res.status(500).json({
            message: "등록 요청 상세를 불러오지 못했습니다."
        });
    }
});


// 프로젝트 등록 요청
router.post("/", async (req, res) => {

    const {
        title,
        content,
        created_by,
        startDate,
        endDate,
        status,
        priority
    } = req.body || {};


    // 제목, 내용 검사
    if (
        typeof title !== "string" ||
        typeof content !== "string" ||
        !title.trim() ||
        !content.trim()
    ) {
        return res.status(400).json({
            message: "프로젝트 제목과 내용을 입력해주세요."
        });
    }


    // 제목 길이 검사
    if (title.trim().length > 200) {
        return res.status(400).json({
            message: "제목은 200자까지 입력할 수 있습니다."
        });
    }


    // 작성자 검사
    if (
        !Number.isSafeInteger(created_by) ||
        created_by <= 0
    ) {
        return res.status(400).json({
            message: "올바른 작성자 정보가 필요합니다."
        });
    }


    // 날짜 검사
    if (
        typeof startDate !== "string" ||
        typeof endDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
        endDate < startDate
    ) {
        return res.status(400).json({
            message: "프로젝트 일정을 확인해주세요."
        });
    }


    // 프로젝트 상태 검사
    if (!["예정", "진행중", "완료", "보류"].includes(status)) {
        return res.status(400).json({
            message: "올바른 프로젝트 상태가 아닙니다."
        });
    }


    // 우선순위 검사
    if (!["낮음", "보통", "높음"].includes(priority)) {
        return res.status(400).json({
            message: "올바른 우선순위가 아닙니다."
        });
    }


    try {

        // 작성자가 실제 직원인지 확인
        const [employees] = await db.query(
            `SELECT employee_id
             FROM employees
             WHERE employee_id = ?`,
            [created_by]
        );

        if (employees.length === 0) {
            return res.status(400).json({
                message: "존재하지 않는 직원입니다."
            });
        }


        // 프로젝트를 바로 등록하지 않고 요청 테이블에 저장
        const [result] = await db.query(`
            INSERT INTO project_requests (
                title,
                content,
                requested_by,
                start_date,
                end_date,
                project_status,
                priority,
                request_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, '대기')
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
            message: "프로젝트 등록 요청 완료",
            requestId: result.insertId
        });

    } catch (error) {

        console.error("프로젝트 요청 오류:", error);

        res.status(500).json({
            message: "프로젝트 등록 요청 실패"
        });
    }

});

module.exports = router;