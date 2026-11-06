// 직원 50명의 공통 비밀번호 설정
// 개발 및 테스트 환경 전용

require("dotenv").config({
    path: require("path").join(__dirname, "../.env")
});

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function resetPasswords() {
    let db;

    try {
        // MySQL 연결
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        // 실제 연결된 DB 확인
        const [dbRows] = await db.query(
            "SELECT DATABASE() AS dbName"
        );

        console.log("연결된 DB:", dbRows[0].dbName);

        if (dbRows[0].dbName !== "mydb_v3") {
            throw new Error("mydb_v3 데이터베이스가 아닙니다.");
        }

        // 정확한 이메일 50개 생성
        const emails = [];

        for (let i = 1; i <= 50; i++) {
            const number = String(i).padStart(3, "0");
            emails.push("emp" + number + "@google.com");
        }

        const placeholders = emails.map(() => "?").join(",");

        // 변경 대상 확인
        const [employees] = await db.query(
            "SELECT employee_id, employee_email FROM employees " +
            "WHERE employee_email IN (" + placeholders + ")",
            emails
        );

        if (employees.length !== 50) {
            throw new Error(
                "대상 직원이 50명이 아닙니다. 현재 " +
                employees.length + "명입니다."
            );
        }

        // 비밀번호 bcrypt 암호화
        const hash = await bcrypt.hash("Test1234!", 10);

        // 암호화 검증
        const matched = await bcrypt.compare("Test1234!", hash);

        if (!matched) {
            throw new Error("비밀번호 암호화 검증 실패");
        }

        // 트랜잭션 시작
        await db.beginTransaction();

        try {
            // 직원 50명의 비밀번호만 변경
            const [result] = await db.query(
                "UPDATE employees SET employee_pw = ? " +
                "WHERE employee_email IN (" + placeholders + ")",
                [hash, ...emails]
            );

            await db.commit();

            console.log("비밀번호 적용 완료");
            console.log("대상 직원:", employees.length);
            console.log("실제 변경된 행:", result.changedRows);
            console.log("bcrypt 검증:", matched);

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error("비밀번호 변경 실패:", error.message);

    } finally {
        if (db) {
            await db.end();
        }
    }
}

resetPasswords();