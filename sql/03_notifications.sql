USE mydb_v3;

-- 알림 테이블: "누구에게(employee_id) 어떤 알림(type, message)이 왔고, 읽었는지(is_read)"를 저장해요.
-- 알림은 이벤트가 생길 때 서버가 INSERT 하고, 마이페이지 알림 탭이 SELECT 해서 보여줘요.
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT           NOT NULL,                  -- 알림을 받는 사람 (employees.employee_id)
    type            VARCHAR(20)   NOT NULL,                  -- '이슈' / '프로젝트' / '휴가'
    message         VARCHAR(300)  NOT NULL,                  -- 화면에 보여줄 문장
    link            VARCHAR(200)  NULL,                      -- 클릭 시 이동할 주소 (없으면 NULL)
    is_read         TINYINT(1)    NOT NULL DEFAULT 0,        -- 0 = 안 읽음, 1 = 읽음
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_noti_employee_read (employee_id, is_read),     -- "내 안 읽은 알림" 조회를 빠르게
    INDEX idx_noti_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- 참고: 다른 테이블(admin_audit_logs)처럼 FOREIGN KEY 는 일부러 뺐어요.
--       employees.employee_id 의 정확한 타입(INT / UNSIGNED)이 다르면 FK 생성이 실패할 수 있어서,
--       타입을 확인한 뒤 필요하면 아래를 추가해요:  SHOW COLUMNS FROM employees LIKE 'employee_id';

-- ===== 테스트 데이터 (본인 직원 번호로 바꿔서 실행) =====
-- 1) 아래 숫자를 실제 로그인하는 본인의 employee_id 로 바꾸세요.
SET @me = 1;

INSERT INTO notifications (employee_id, type, message, link, is_read) VALUES
  (@me, '프로젝트', '내가 담당하는 "신규 ERP 구축" 프로젝트가 진행중으로 변경됐어요.', NULL, 0),
  (@me, '이슈',     '내가 등록한 이슈 "로그인 오류"가 처리 완료됐어요.',               NULL, 0),
  (@me, '휴가',     '신청한 휴가가 승인됐어요.',                                       NULL, 1);

-- 확인용
-- SELECT * FROM notifications WHERE employee_id = @me ORDER BY created_at DESC;
