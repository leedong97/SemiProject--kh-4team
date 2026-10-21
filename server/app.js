
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

app.get("/api/employees", async (req, res) => {
    try {
        const [rows] = await db.query(`
        SELECT
          employee_id,
          employee_name,
          employee_department,
          employee_position,
          employee_email,
          employee_phone,
          employee_hireDate,
          employee_grade
        FROM employees
        ORDER BY employee_name
      `);

        res.json(rows);
    } catch (error) {
        console.error("사원 조회 오류:", error.message);
        res.status(500).json({
            message: "사원 목록을 불러오지 못했습니다.",
        });
    }
});


/* 관리자 대시보드 데이터 조회 */
app.get("/api/admin/dashboard", async (req, res) => {
    try {
        const [
            [employeeRows],
            [unassignedBugRows],
            [delayedProjectRows],
            [evaluationRows],
            [bugs],
            [evaluations],
        ] = await Promise.all([
            db.query(`
          SELECT COUNT(*) AS total
          FROM employees
        `),

            db.query(`
          SELECT COUNT(*) AS total
          FROM bugs
          WHERE assigned_employee_id IS NULL
            AND UPPER(bug_status) NOT IN ('RESOLVED', 'CLOSED')
        `),

            db.query(`
          SELECT COUNT(*) AS total
          FROM projects
          WHERE project_end_date < CURDATE()
            AND project_progress < 100
        `),

            db.query(`
          SELECT COUNT(*) AS total
          FROM employee_evaluations
        `),

            db.query(`
          SELECT
            b.bug_id,
            b.bug_title,
            b.bug_severity,
            b.bug_status,
            b.bug_created_at,
            p.project_name
          FROM bugs b
          LEFT JOIN projects p
            ON b.project_id = p.project_id
          WHERE b.assigned_employee_id IS NULL
            AND UPPER(b.bug_status) NOT IN ('RESOLVED', 'CLOSED')
          ORDER BY b.bug_created_at DESC
          LIMIT 5
        `),

            db.query(`
          SELECT
            e.evaluation_id,
            emp.employee_name,
            e.evaluation_score,
            e.evaluation_period,
            e.evaluation_comment
          FROM employee_evaluations e
          JOIN employees emp
            ON e.employee_id = emp.employee_id
          ORDER BY e.evaluation_period DESC,
                   e.evaluation_id DESC
          LIMIT 5
        `),
        ]);

        res.json({
            summary: {
                totalEmployees: employeeRows[0].total,
                unassignedBugs: unassignedBugRows[0].total,
                delayedProjects: delayedProjectRows[0].total,
                totalEvaluations: evaluationRows[0].total,
            },
            unassignedBugs: bugs,
            recentEvaluations: evaluations,
        });
    } catch (error) {
        console.error("관리자 대시보드 조회 오류:", error);

        res.status(500).json({
            message: "관리자 대시보드 데이터를 불러오지 못했습니다.",
            error: error.message,
        });
    }
});


/* 버그 담당자 지정 */
app.patch("/api/bugs/:bugId/assign", async (req, res) => {
    const { bugId } = req.params;
    const { employee_id } = req.body;

    if (!employee_id) {
        return res.status(400).json({
            message: "담당 사원을 선택해 주세요.",
        });
    }

    try {
        // 해당 사원이 실제로 존재하는지 확인
        const [employees] = await db.query(
            "SELECT employee_id FROM employees WHERE employee_id = ?",
            [employee_id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: "해당 사원을 찾을 수 없습니다.",
            });
        }

        // 해당 버그가 존재하는지 확인
        const [bugs] = await db.query(
            "SELECT bug_id FROM bugs WHERE bug_id = ?",
            [bugId]
        );

        if (bugs.length === 0) {
            return res.status(404).json({
                message: "해당 버그를 찾을 수 없습니다.",
            });
        }

        // 담당자 지정
        await db.query(
            `UPDATE bugs
             SET assigned_employee_id = ?
             WHERE bug_id = ?`,
            [employee_id, bugId]
        );

        res.json({
            message: "버그 담당자가 지정되었습니다.",
            bug_id: bugId,
            employee_id,
        });
    } catch (error) {
        console.error("버그 담당자 지정 오류:", error);

        res.status(500).json({
            message: "버그 담당자 지정에 실패했습니다.",
        });
    }
});



const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`NEXUS ERP API 서버 실행: http://localhost:${PORT}`);
});
