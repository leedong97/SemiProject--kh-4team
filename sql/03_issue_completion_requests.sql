-- 기존 issues 상태값은 변경하지 않습니다. 승인 시에만 완료로 갱신합니다.
CREATE TABLE IF NOT EXISTS issue_completion_requests (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  issue_id INT NOT NULL,
  requester_id INT NOT NULL,
  resolution TEXT NOT NULL,
  status ENUM('대기', '승인', '반려') NOT NULL DEFAULT '대기',
  review_comment TEXT NULL,
  reviewer_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  INDEX idx_issue_completion_status (status, created_at),
  INDEX idx_issue_completion_issue (issue_id, status),
  INDEX idx_issue_completion_requester (requester_id),
  CONSTRAINT fk_issue_completion_issue FOREIGN KEY (issue_id) REFERENCES issues(issue_id),
  CONSTRAINT fk_issue_completion_requester FOREIGN KEY (requester_id) REFERENCES employees(employee_id),
  CONSTRAINT fk_issue_completion_reviewer FOREIGN KEY (reviewer_id) REFERENCES employees(employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
