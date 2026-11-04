-- DBeaver에서 처음 한 번만 실행합니다. 기존 employee_evaluations는 삭제/변경하지 않습니다.
USE mydb_v3;
CREATE TABLE IF NOT EXISTS nexus_evaluations (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    employee_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    period VARCHAR(40) NOT NULL,
    project_score DECIMAL(5,1) NOT NULL,
    issue_score DECIMAL(5,1) NOT NULL,
    schedule_score DECIMAL(5,1) NOT NULL,
    teamwork_score DECIMAL(5,1) NOT NULL,
    total_score DECIMAL(5,1) NOT NULL,
    feedback TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT '초안',
    reject_reason TEXT NULL,
    appeal_reason TEXT NULL,
    appeal_status VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_nexus_evaluation (project_id, employee_id, period),
    INDEX idx_nexus_employee (employee_id),
    INDEX idx_nexus_evaluator (evaluator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS nexus_evaluation_history (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    evaluation_id INT NOT NULL,
    actor_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    detail TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nexus_evaluation_history (evaluation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
