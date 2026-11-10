const db = require('../../db');
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
const id = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) fail('올바른 번호가 필요합니다.'); return n; };
const text = (value, max) => { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail('입력 내용과 길이를 확인해주세요.'); return value.trim(); };
const anonymous = (value, fallback = false) => value === undefined ? fallback : value === true || value === 1 || value === 'true' || value === '1';
async function transaction(fn) {
    const c = await db.getConnection();
    try { await c.beginTransaction(); const result = await fn(c); await c.commit(); return result; }
    catch (e) { await c.rollback(); throw e; } finally { c.release(); }
}
// 반드시 게시글 행을 먼저 FOR UPDATE로 잠근 트랜잭션 안에서 호출합니다.
async function numberFor(c, postId, userId) {
    const [rows] = await c.query('SELECT anonymous_number FROM community_anonymous WHERE post_id=? AND employee_id=?', [postId, userId]);
    if (rows.length) return rows[0].anonymous_number;
    const [counts] = await c.query('SELECT COALESCE(MAX(anonymous_number),0)+1 AS n FROM community_anonymous WHERE post_id=?', [postId]);
    const n = Number(counts[0].n);
    await c.query('INSERT INTO community_anonymous VALUES (?,?,?)', [postId, userId, n]);
    return n;
}
function decodeFiles(input = []) {
    if (!Array.isArray(input) || input.length > 5) fail('첨부파일은 최대 5개입니다.');
    let total = 0;
    return input.map(f => {
        if (!f || typeof f.name !== 'string' || !f.name.trim() || f.name.length > 255 || /[\x00-\x1f/\\]/.test(f.name)) fail('파일 이름을 확인해주세요.');
        if (typeof f.base64 !== 'string' || f.base64.length > 7 * 1024 * 1024 || f.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64)) fail('파일 데이터가 올바르지 않습니다.');
        const data = Buffer.from(f.base64, 'base64');
        if (data.toString('base64') !== f.base64) fail('파일 데이터가 올바르지 않습니다.');
        total += data.length;
        if (data.length > 5 * 1024 * 1024 || total > 10 * 1024 * 1024) fail('파일당 5MB, 합계 10MB까지 첨부할 수 있습니다.');
        // HTML/SVG 등 실행 가능한 형식은 미리보기하지 않고 다운로드로 제공합니다.
        let mime = 'application/octet-stream';
        if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) mime = 'image/png';
        else if (data[0] === 255 && data[1] === 216 && data[2] === 255) mime = 'image/jpeg';
        else if (['GIF87a', 'GIF89a'].includes(data.subarray(0, 6).toString())) mime = 'image/gif';
        else if (data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP') mime = 'image/webp';
        return { name: f.name, data, mime, size: data.length };
    });
}
async function attachments(c, postId, commentId, newFiles, removeIds = []) {
    if (!Array.isArray(removeIds)) fail('첨부 삭제 목록을 확인해주세요.');
    const [old] = await c.query('SELECT id,file_size FROM community_attachment WHERE post_id=? AND comment_id <=> ?', [postId, commentId]);
    const remove = new Set(removeIds.map(id));
    if ([...remove].some(n => !old.some(f => Number(f.id) === n))) fail('삭제할 첨부파일이 이 글에 속하지 않습니다.');
    const keep = old.filter(f => !remove.has(Number(f.id)));
    if (keep.length + newFiles.length > 5 || keep.reduce((s, f) => s + f.file_size, 0) + newFiles.reduce((s, f) => s + f.size, 0) > 10 * 1024 * 1024) fail('첨부파일은 최대 5개, 합계 10MB입니다.');
    for (const n of remove) await c.query('DELETE FROM community_attachment WHERE id=?', [n]);
    for (const f of newFiles) await c.query('INSERT INTO community_attachment (post_id,comment_id,original_name,mime_type,file_size,file_data) VALUES (?,?,?,?,?,?)', [postId, commentId, f.name, f.mime, f.size, f.data]);
}
async function present(c, rows, userId, kind) {
    if (!rows.length) return [];
    const postIds = [...new Set(rows.map(r => kind === 'post' ? r.id : r.postId))];
    const [aliases] = await c.query('SELECT post_id,employee_id,anonymous_number FROM community_anonymous WHERE post_id IN (?)', [postIds]);
    const [attached] = await c.query('SELECT id,post_id,comment_id,original_name AS name,mime_type AS mimeType,file_size AS size FROM community_attachment WHERE post_id IN (?)', [postIds]);
    return rows.map(row => {
        const postId = kind === 'post' ? row.id : row.postId;
        const isOwner = String(row.authorId) === String(userId);
        const isAnonymous = row.isAnonymous === true || Number(row.isAnonymous) === 1;
        const alias = aliases.find(a => String(a.post_id) === String(postId) && String(a.employee_id) === String(row.authorId));
        const deleted = row.isDeleted === true || Number(row.isDeleted) === 1;
        return {
            ...row, isOwner, isAnonymous, anonymousNumber: isAnonymous ? alias?.anonymous_number : null,
            authorId: deleted || isAnonymous && !isOwner ? null : row.authorId,
            authorName: deleted ? '삭제된 댓글' : isAnonymous ? (kind === 'post' ? '익명' : '익명' + (alias?.anonymous_number || '')) : row.authorName,
            content: deleted ? '삭제된 댓글입니다.' : row.content,
            attachments: deleted ? [] : attached.filter(f => String(f.post_id) === String(postId) && (kind === 'post' ? f.comment_id === null : String(f.comment_id) === String(row.id))).map(({ post_id, comment_id, ...f }) => f)
        };
    });
}
const postSelect = `SELECT p.id,p.board_name AS boardName,p.title,p.content,p.author_id AS authorId,e.employee_name AS authorName,p.is_anonymous AS isAnonymous,p.created_at AS createdAt,p.updated_at AS updatedAt,p.is_resolved AS isResolved,(SELECT COUNT(*) FROM community_comment cc WHERE cc.post_id=p.id AND cc.is_deleted=0) AS commentCount FROM community_post p LEFT JOIN employees e ON e.employee_id=p.author_id`;
async function postResult(c, postId, userId) { const [rows] = await c.query(postSelect + ' WHERE p.id=?', [postId]); return (await present(c, rows, userId, 'post'))[0]; }
async function lockPost(c, postId) { const [rows] = await c.query('SELECT * FROM community_post WHERE id=? FOR UPDATE', [postId]); if (!rows.length) fail('게시글이 없습니다.', 404); return rows[0]; }
function errorHandler(error, req, res, next) {
    console.error('커뮤니티 처리 오류:', error.code || error.message);
    res.status(error.status || 500).json({ message: error.status ? error.message : '저장 또는 조회에 실패했습니다. DB 마이그레이션과 연결 설정을 확인해주세요.' });
}

module.exports = { wrap, fail, id, text, anonymous, transaction, numberFor, decodeFiles, attachments, present, postResult, lockPost, errorHandler };
