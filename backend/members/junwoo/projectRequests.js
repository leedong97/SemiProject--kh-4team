// 프로젝트 등록 요청 API

const express = require("express");
const db = require("../../db");

const router = express.Router();


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