-- =====================================================================
--  직원 평가(희승 담당) 테이블 생성
--  backend/members/heeseung/evaluations.js 가 쓰는 컬럼 기준으로 만들었어요.
--  실행: mydb_v3 데이터베이스에서 한 번만 실행 (이미 있으면 건너뜀)
-- =====================================================================
USE mydb_v3;

-- 평가 본문 (프로젝트·직원·기간 조합은 하나만 가능)
CREATE TABLE IF NOT EXISTS nexus_evaluations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT NOT NULL,
    employee_id     INT NOT NULL,            -- 평가 대상 직원
    evaluator_id    INT NOT NULL,            -- 평가 작성자(PM)
    period          VARCHAR(40) NOT NULL,
    project_score   DECIMAL(5,1) NOT NULL DEFAULT 0,
    issue_score     DECIMAL(5,1) NOT NULL DEFAULT 0,
    schedule_score  DECIMAL(5,1) NOT NULL DEFAULT 0,
    teamwork_score  DECIMAL(5,1) NOT NULL DEFAULT 0,
    total_score     DECIMAL(5,1) NOT NULL DEFAULT 0,
    feedback        TEXT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT '초안',   -- 초안 / 승인 요청 / 승인 / 반려
    reject_reason   VARCHAR(500) NULL,
    appeal_reason   VARCHAR(500) NULL,
    appeal_status   VARCHAR(20) NULL,                     -- 접수 / 수용 / 기각
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_eval_project_employee_period (project_id, employee_id, period),
    INDEX idx_eval_employee (employee_id),
    INDEX idx_eval_evaluator (evaluator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 평가 변경 이력 (등록·수정·제출·승인·반려·이의신청 기록)
CREATE TABLE IF NOT EXISTS nexus_evaluation_history (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    evaluation_id INT NOT NULL,
    actor_id      INT NOT NULL,
    action        VARCHAR(50) NOT NULL,
    detail        VARCHAR(500) NULL,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_eval_hist_eval (evaluation_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
