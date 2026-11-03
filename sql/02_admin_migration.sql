USE mydb_v3;
-- 관리자 감사 로그: 프로젝트 변경과 동일 트랜잭션으로 기록
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_audit_created (created_at),
    INDEX idx_admin_audit_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 실제 관리자 계정의 employee_role을 '관리자'로 지정해야 접근 가능합니다.
-- UPDATE employees SET employee_role='관리자' WHERE employee_id=실제관리자ID;
