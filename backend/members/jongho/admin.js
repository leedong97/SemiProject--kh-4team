const express = require('express');
const pool = require('../../db');
const { validId } = require('./adminHelpers');

const router = express.Router();

// 직원 평가 목록 (프론트가 쓰는 필드명으로 별칭 지정)
router.get('/evaluations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ev.evaluation_id      AS id,
             ev.employee_id        AS employeeId,
             ev.evaluator_id       AS evaluatorId,
             ev.evaluation_period  AS period,
             ev.evaluation_score   AS score,
             ev.evaluation_comment AS feedback,
             ev.evaluation_status  AS status,
             ev.appeal,
             ev.employee_response  AS employeeResponse,
             e.employee_name       AS employeeName
      FROM employee_evaluations ev
      LEFT JOIN employees e ON ev.employee_id = e.employee_id
      ORDER BY ev.evaluation_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 직원 목록 (화면 필드명으로 매핑)
// 민감 정보(비밀번호, 급여, 전화번호, 주소, 입사일)는 조회하지 않습니다.
// 매핑: team←employee_team, position←employee_position(직무), rank←employee_grade(직급), role←employee_role
router.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT employee_id       AS id,
             employee_name     AS name,
             employee_team     AS team,
             employee_position AS position,
             employee_role     AS role,
             employee_grade    AS \`rank\`,
             employee_status   AS status
      FROM employees
      ORDER BY employee_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 재무 요약: 재직자 연봉 합계와 인원 수만 내려줍니다 (개인별 급여는 내려주지 않음)
router.get('/finance/summary', async (req, res) => {
  try {
    const [[row]] = await pool.query(`
      SELECT COUNT(*)                        AS headcount,
             COALESCE(SUM(employee_salary), 0) AS totalSalary
      FROM employees
      WHERE employee_status = '재직'
    `);
    res.json({ headcount: Number(row.headcount), totalSalary: Number(row.totalSalary) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 이슈 목록 (대시보드·이슈 관리용)
// due 는 날짜 문자열(YYYY-MM-DD)로 맞춰서 화면의 날짜 비교가 그대로 동작하도록 합니다.
router.get('/issues', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.issue_id                       AS id,
             i.issue_title                    AS title,
             i.project_id                     AS projectId,
             p.project_title                  AS projectName,
             i.assigned_employee_id           AS assigneeId,
             i.reporter_id                    AS reporterId,
             i.issue_priority                 AS priority,
             i.issue_status                   AS status,
             i.issue_description              AS description,
             DATE_FORMAT(i.issue_created_at, '%Y-%m-%d %H:%i') AS createdAt,
             DATE_FORMAT(i.issue_due_date, '%Y-%m-%d') AS due
      FROM issues i
      LEFT JOIN projects p ON p.project_id = i.project_id
      ORDER BY i.issue_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== 커뮤니티 관리 (게시글·댓글 목록과 삭제만 제공) =====
// 익명 글은 작성자를 '익명'으로만 보여준다 (실제 작성자는 노출하지 않음)

// 공지 한 건의 행사일 (공지 수정 폼에 기존 행사일을 채우기 위해)
router.get('/notices/:id/event-date', async (req, res) => {
  const noticeId = Number(req.params.id);
  if (!validId(noticeId)) return res.status(400).json({ message: '잘못된 공지 번호입니다.' });
  try {
    const [rows] = await pool.query(
      "SELECT DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate FROM notices WHERE notice_id = ?",
      [noticeId]
    );
    if (!rows.length) return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    res.json({ eventDate: rows[0].eventDate || null });
  } catch (err) {
    console.error('[공지 행사일 조회 실패]', err);
    res.status(500).json({ message: `행사일을 불러오지 못했습니다. (${err.code || err.message})` });
  }
});

// ===== 커뮤니티 게시글 보관 =====
// 관리자가 지운 게시글은 원본을 지우기 전에 스냅샷(게시글 + 댓글 전체)으로 보관해서
// 커뮤니티 관리 화면에서 계속 확인할 수 있게 한다. 일반 커뮤니티 화면에서는 보이지 않는다.
let archiveTableReady = null;
function ensureArchiveTable() {
  if (!archiveTableReady) {
    archiveTableReady = pool.query(`
      CREATE TABLE IF NOT EXISTS community_post_archive (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        post_id BIGINT UNSIGNED NOT NULL,
        board_name VARCHAR(100) NULL,
        title VARCHAR(500) NOT NULL,
        content MEDIUMTEXT NULL,
        author_name VARCHAR(100) NULL,
        is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
        created_at VARCHAR(20) NULL,
        deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        comments_json MEDIUMTEXT NULL
      )`).catch((err) => {
      archiveTableReady = null;
      throw err;
    });
  }
  return archiveTableReady;
}

function parseComments(json) {
  try {
    const list = JSON.parse(json || '[]');
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

// 게시글 목록 (살아 있는 글 + 관리자가 지운 글)
router.get('/community/posts', async (req, res) => {
  try {
    await ensureArchiveTable();
    const [rows] = await pool.query(`
      SELECT p.id, p.board_name AS boardName, p.title, p.is_anonymous AS isAnonymous,
             e.employee_name AS authorName,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt,
             (SELECT COUNT(*) FROM community_comment c WHERE c.post_id = p.id AND c.is_deleted = 0) AS commentCount
      FROM community_post p
      LEFT JOIN employees e ON e.employee_id = p.author_id
      ORDER BY p.id DESC
      LIMIT 300
    `);
    const [archived] = await pool.query(`
      SELECT id, board_name AS boardName, title, is_anonymous AS isAnonymous,
             author_name AS authorName, created_at AS createdAt,
             DATE_FORMAT(deleted_at, '%Y-%m-%d %H:%i') AS deletedAt,
             comments_json AS commentsJson
      FROM community_post_archive
      ORDER BY id DESC
      LIMIT 300
    `);

    const live = rows.map((r) => ({
      ...r,
      isArchived: false,
      authorName: r.authorName,
    }));
    const dead = archived.map((r) => ({
      id: `archive-${r.id}`,
      archiveId: r.id,
      isArchived: true,
      boardName: r.boardName,
      title: r.title,
      isAnonymous: !!r.isAnonymous,
      authorName: r.authorName,
      createdAt: r.createdAt,
      deletedAt: r.deletedAt,
      commentCount: parseComments(r.commentsJson).filter((c) => !c.isDeleted).length,
    }));

    res.json([...live, ...dead].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))));
  } catch (err) {
    res.status(500).json({ message: '게시글 목록을 불러오지 못했습니다.' });
  }
});

// 살아 있는 게시글 한 건 + 댓글 (삭제된 댓글도 원래 내용을 함께 보낸다)
router.get('/community/posts/:id', async (req, res) => {
  const postId = Number(req.params.id);
  if (!validId(postId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
  try {
    const [posts] = await pool.query(`
      SELECT p.id, p.board_name AS boardName, p.title, p.content, p.is_anonymous AS isAnonymous,
             e.employee_name AS authorName,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_post p
      LEFT JOIN employees e ON e.employee_id = p.author_id
      WHERE p.id = ?
    `, [postId]);
    if (!posts.length) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    const post = posts[0];
    post.isDeleted = false;

    const [comments] = await pool.query(`
      SELECT
          c.id,
          c.parent_id AS parentId,
          c.content,
          c.is_deleted AS isDeleted,
          c.is_anonymous AS isAnonymous,
          e.employee_name AS authorName,
          DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_comment c
      LEFT JOIN employees e ON e.employee_id = c.author_id
      WHERE c.post_id = ?
      ORDER BY c.id
  `, [postId]);

    res.json({
      isArchived: false,
      post,
      comments: comments.map((c) => ({ ...c, isDeleted: !!c.isDeleted, parentId: c.parentId ?? null })),
    });
  } catch (err) {
    res.status(500).json({ message: '게시글을 불러오지 못했습니다.' });
  }
});

// 관리자가 지운 게시글 한 건 (보관본)
router.get('/community/archive/:id', async (req, res) => {
  const archiveId = Number(req.params.id);
  if (!validId(archiveId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
  try {
    await ensureArchiveTable();
    const [rows] = await pool.query(`
      SELECT id, post_id AS postId, board_name AS boardName, title, content,
             author_name AS authorName, is_anonymous AS isAnonymous, created_at AS createdAt,
             DATE_FORMAT(deleted_at, '%Y-%m-%d %H:%i') AS deletedAt,
             comments_json AS commentsJson
      FROM community_post_archive
      WHERE id = ?
    `, [archiveId]);
    if (!rows.length) return res.status(404).json({ message: '보관된 게시글을 찾을 수 없습니다.' });
    const row = rows[0];
    res.json({
      isArchived: true,
      post: {
        id: row.id,
        postId: row.postId,
        boardName: row.boardName,
        title: row.title,
        content: row.content,
        authorName: row.authorName,
        isAnonymous: !!row.isAnonymous,
        createdAt: row.createdAt,
        deletedAt: row.deletedAt,
        isDeleted: true,
      },
      comments: parseComments(row.commentsJson).map((c) => ({ ...c, isDeleted: !!c.isDeleted })),
    });
  } catch (err) {
    res.status(500).json({ message: '보관된 게시글을 불러오지 못했습니다.' });
  }
});

// 게시글 삭제: 원본을 지우기 전에 게시글과 댓글 전체를 보관본으로 남긴다 (한 트랜잭션)
router.delete('/community/posts/:id', async (req, res) => {
  const postId = Number(req.params.id);
  if (!validId(postId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
  let conn;
  try {
    await ensureArchiveTable();
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [posts] = await conn.query(`
      SELECT p.id, p.board_name AS boardName, p.title, p.content, p.is_anonymous AS isAnonymous,
             e.employee_name AS authorName,
             DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_post p
      LEFT JOIN employees e ON e.employee_id = p.author_id
      WHERE p.id = ?
      FOR UPDATE
    `, [postId]);
    if (!posts.length) {
      await conn.rollback();
      return res.status(404).json({ message: '삭제할 게시글이 없습니다.' });
    }
    const post = posts[0];

    const [comments] = await conn.query(`
      SELECT
          c.id,
          c.parent_id AS parentId,
          c.content,
          c.is_deleted AS isDeleted,
          c.is_anonymous AS isAnonymous,
          e.employee_name AS authorName,
          DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_comment c
      LEFT JOIN employees e ON e.employee_id = c.author_id
      WHERE c.post_id = ?
      ORDER BY c.id
  `, [postId]);

    await conn.query(`
      INSERT INTO community_post_archive
        (post_id, board_name, title, content, author_name, is_anonymous, created_at, comments_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      post.id,
      post.boardName,
      post.title,
      post.content,
      post.authorName,
      post.isAnonymous ? 1 : 0,
      post.createdAt,
      JSON.stringify(comments),
    ]);

    // 댓글끼리 연결된 외래키(parent_id)는 ON DELETE RESTRICT라서, 대댓글을 먼저 지우고 원댓글을 지운다
    await conn.query('DELETE FROM community_comment WHERE post_id = ? AND parent_id IS NOT NULL', [postId]);
    await conn.query('DELETE FROM community_comment WHERE post_id = ?', [postId]);
    await conn.query('DELETE FROM community_post WHERE id = ?', [postId]);
    await conn.commit();
    res.json({ message: '게시글을 삭제했습니다.' });
  } catch (err) {
    console.error('[커뮤니티 게시글 삭제 실패]', err);
    if (conn) await conn.rollback().catch(() => { });
    res.status(500).json({ message: `게시글 삭제에 실패했습니다. (${err.code || err.message})` });
  } finally {
    if (conn) conn.release();
  }
});

// 댓글 삭제: 내용은 지우지 않고 삭제 표시만 한다 (일반 화면은 '삭제된 댓글입니다.'로 보이고, 관리 화면에서는 원래 내용을 볼 수 있다)
router.delete('/community/comments/:id', async (req, res) => {
  const commentId = Number(req.params.id);
  if (!validId(commentId)) return res.status(400).json({ message: '잘못된 댓글 번호입니다.' });
  try {
    const [result] = await pool.query(
      'UPDATE community_comment SET is_deleted = 1 WHERE id = ? AND is_deleted = 0',
      [commentId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: '삭제할 댓글이 없거나 이미 삭제되었습니다.' });
    res.json({ message: '댓글을 삭제했습니다.' });
  } catch (err) {
    res.status(500).json({ message: '댓글 삭제에 실패했습니다.' });
  }
});

router.use(require('./adminProjects'));

module.exports = router;