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
// 관리자에게는 익명 글도 실제 작성자를 보여준다.

// 게시글 목록
router.get('/community/posts', async (req, res) => {
  try {
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
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '게시글 목록을 불러오지 못했습니다.' });
  }
});

// 게시글 한 건 + 댓글
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
    post.authorName = post.isAnonymous ? '익명' : post.authorName;

    const [comments] = await pool.query(`
      SELECT c.id, c.content, c.is_deleted AS isDeleted, c.is_anonymous AS isAnonymous,
       e.employee_name AS authorName,
             DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS createdAt
      FROM community_comment c
      LEFT JOIN employees e ON e.employee_id = c.author_id
      WHERE c.post_id = ?
      ORDER BY c.id
    `, [postId]);
    res.json({ post, comments: comments.map((c) => ({ ...c, content: c.isDeleted ? '' : c.content })) });
  } catch (err) {
    res.status(500).json({ message: '게시글을 불러오지 못했습니다.' });
  }
});

// 게시글 삭제 (준우 쪽과 같이 실제로 지운다)
router.delete('/community/posts/:id', async (req, res) => {
  const postId = Number(req.params.id);
  if (!validId(postId)) return res.status(400).json({ message: '잘못된 게시글 번호입니다.' });
  try {
    const [result] = await pool.query('DELETE FROM community_post WHERE id = ?', [postId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: '삭제할 게시글이 없습니다.' });
    res.json({ message: '게시글을 삭제했습니다.' });
  } catch (err) {
    res.status(500).json({ message: '게시글 삭제에 실패했습니다.' });
  }
});

// 댓글 삭제 (준우 쪽과 같이 내용을 비우고 삭제 표시)
router.delete('/community/comments/:id', async (req, res) => {
  const commentId = Number(req.params.id);
  if (!validId(commentId)) return res.status(400).json({ message: '잘못된 댓글 번호입니다.' });
  try {
    const [result] = await pool.query(
      "UPDATE community_comment SET content = '', is_deleted = 1 WHERE id = ? AND is_deleted = 0",
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
