// 실행: backend 폴더에서 node members/dong/migrate-community.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env'), quiet: true });
const db = require('../../db');
async function migrate() {
    const types = {};
    for (const [table, column] of [['community_post', 'id'], ['community_comment', 'id'], ['employees', 'employee_id']]) {
        const [rows] = await db.query('SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, column]);
        if (!rows.length || !/^(tinyint|smallint|mediumint|int|bigint)(\(\d+\))?( unsigned)?$/i.test(rows[0].COLUMN_TYPE)) throw new Error('기존 테이블/정수 ID 구조 확인 필요: ' + table);
        types[table] = rows[0].COLUMN_TYPE;
    }
    for (const table of ['community_post', 'community_comment']) {
        const [rows] = await db.query('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, 'is_anonymous']);
        if (!rows.length) await db.query(`ALTER TABLE ${table} ADD COLUMN is_anonymous TINYINT(1) NOT NULL DEFAULT 0`);
    }
    for (const [column, definition] of [['parent_id', types.community_comment + ' NULL'], ['is_deleted', 'TINYINT(1) NOT NULL DEFAULT 0']]) {
        const [rows] = await db.query('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', ['community_comment', column]);
        if (!rows.length) await db.query(`ALTER TABLE community_comment ADD COLUMN ${column} ${definition}`);
    }
    await db.query(`CREATE TABLE IF NOT EXISTS community_session (
    token_hash CHAR(64) PRIMARY KEY, employee_id ${types.employees} NOT NULL, expires_at DATETIME NOT NULL,
    INDEX (expires_at), FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
    await db.query(`CREATE TABLE IF NOT EXISTS community_anonymous (
    post_id ${types.community_post} NOT NULL, employee_id ${types.employees} NOT NULL, anonymous_number INT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id, employee_id), UNIQUE KEY (post_id, anonymous_number),
    FOREIGN KEY (post_id) REFERENCES community_post(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
    await db.query(`CREATE TABLE IF NOT EXISTS community_attachment (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, post_id ${types.community_post} NOT NULL,
    comment_id ${types.community_comment} NULL, original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL, file_size INT UNSIGNED NOT NULL, file_data LONGBLOB NOT NULL,
    INDEX (post_id, comment_id),
    FOREIGN KEY (post_id) REFERENCES community_post(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES community_comment(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);
    console.log('완료: 익명 여부 컬럼 2개, 댓글 parent_id/is_deleted, 세션/익명번호/첨부파일 테이블 3개. 기존 게시글·댓글 유지.');
}
if (require.main === module) migrate().catch(e => { console.error('마이그레이션 실패:', e.code || '', e.message); process.exitCode = 1; }).finally(() => db.end());
module.exports = migrate;
