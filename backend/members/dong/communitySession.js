const crypto = require('crypto');
const db = require('../../db');
const hash = token => crypto.createHash('sha256').update(token).digest('hex');
async function issueSession(employeeId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.query('DELETE FROM community_session WHERE expires_at < NOW()');
  await db.query('INSERT INTO community_session (token_hash, employee_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))', [hash(token), employeeId]);
  return token;
}
async function session(req, res, next) {
  console.log('[커뮤니티 인증 시작]', req.method, req.originalUrl);
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    if (/^[a-f0-9]{64}$/.test(token)) {
      const [rows] = await db.query(`SELECT e.employee_id AS id, e.employee_name AS name FROM community_session s JOIN employees e ON e.employee_id=s.employee_id WHERE s.token_hash=? AND s.expires_at > NOW() AND e.employee_status='재직'`, [hash(token)]);
      req.communityUser = rows[0];
      console.log('[커뮤니티 인증 조회 완료]', req.originalUrl, '인증 성공:', Boolean(req.communityUser));
    
    }
    next();
  } catch (error) { next(error); }
}
function requireUser(req, res, next) {
  if (!req.communityUser) return res.status(401).json({ message: '커뮤니티 이용을 위해 다시 로그인해주세요.' });
  next();
}
module.exports = { issueSession, session, requireUser };
