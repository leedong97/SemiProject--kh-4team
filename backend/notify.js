// 공용 알림 저장 함수 (알림 저장이 실패해도 호출한 쪽 기능은 멈추지 않게 try-catch 로 감쌌어요)
const pool = require("./db");

async function createNotification(employeeId, type, message, link) {
    const id = Number(employeeId);
    if (!Number.isInteger(id) || id < 1) {
        return; // 받는 사람 번호가 이상하면 조용히 건너뜀
    }

    try {
        await pool.query(
            `INSERT INTO notifications (employee_id, type, message, link)
             VALUES (?, ?, ?, ?)`,
            [id, type, message, link || null]
        );
    } catch (err) {
        console.error("알림 저장 오류:", err.code, err.message);
    }
}

// 재직 중인 관리자 모두에게 알림 (excludeIds: 받지 않을 직원 번호들, 예: 요청을 올린 본인)
async function createNotificationForManagers(type, message, link, excludeIds) {
    try {
        const exclude = new Set((excludeIds || []).map(String));
        const [rows] = await pool.query(
            "SELECT employee_id FROM employees WHERE employee_role = '관리자' AND employee_status = '재직'"
        );
        for (const row of rows) {
            if (exclude.has(String(row.employee_id))) continue;
            await createNotification(row.employee_id, type, message, link);
        }
    } catch (err) {
        console.error("관리자 알림 오류:", err.code, err.message);
    }
}

module.exports = { createNotification, createNotificationForManagers };
