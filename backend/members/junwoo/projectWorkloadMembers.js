const express = require("express");
const db = require("../../db");

const router = express.Router();

// 프로젝트에 참여하거나 PM으로 배정된 직원별 프로젝트 수
router.get("/", async function (req, res) {
    try {
        const [rows] = await db.query(`
            SELECT
                e.employee_id AS id,
                e.employee_name AS name,
                COUNT(DISTINCT membership.project_id) AS projectCount
            FROM employees e
            JOIN (
                SELECT
                    pm.employee_id,
                    pm.project_id
                FROM project_members pm
                JOIN projects p
                    ON p.project_id = pm.project_id

                UNION

                SELECT
                    p.manager_id AS employee_id,
                    p.project_id
                FROM projects p
                WHERE p.manager_id IS NOT NULL
            ) membership
                ON membership.employee_id = e.employee_id
            GROUP BY
                e.employee_id,
                e.employee_name
            ORDER BY
                projectCount DESC,
                e.employee_name,
                e.employee_id
        `);

        res.set("Cache-Control", "no-store");

        res.json(
            rows.map(function (row) {
                return {
                    id: row.id,
                    name: row.name,
                    projectCount: Number(row.projectCount),
                };
            })
        );
    } catch (error) {
        console.error(
            "프로젝트 참여 직원 조회 실패:",
            error.code,
            error.message
        );

        res.status(500).json({
            message: "프로젝트 참여 직원 목록을 불러오지 못했습니다.",
        });
    }
});

module.exports = router;