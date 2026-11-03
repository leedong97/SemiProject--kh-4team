// (참고용) 토큰 로그인 방식 관리자 보안 모듈. 지금은 어디에서도 require 하지 않아요.
// 나중에 관리자 로그인을 붙일 때 jongho/index.js 의 devRouter 대신 사용하세요.
// Node.js 기본 crypto를 이용한 서명 토큰 (별도 패키지 불필요)
const crypto = require('crypto');
const SECRET = process.env.SESSION_SECRET;
if (!SECRET || SECRET.length < 32) {
    throw new Error('backend/.env에 32자 이상의 SESSION_SECRET을 설정하세요.');
}
function sign(user) {
    const payload = Buffer.from(JSON.stringify({ id: user.employee_id, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
    return payload + '.' + signature;
}
function requireAdmin(req, res, next) {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const parts = token.split('.');
    if (parts.length !== 2) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const expected = crypto.createHmac('sha256', SECRET).update(parts[0]).digest('base64url');
    if (parts[1].length !== expected.length || !crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expected))) {
        return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
    }
    let payload;
    try { payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); } catch (error) {
        return res.status(401).json({ message: '인증 정보가 손상되었습니다.' });
    }
    if (!Number.isInteger(payload.id) || payload.exp < Date.now()) return res.status(401).json({ message: '로그인이 만료되었습니다.' });
    const pool = require('../../db');
    pool.query('SELECT employee_id, employee_role, employee_status FROM employees WHERE employee_id = ?', [payload.id])
        .then(([rows]) => {
            const user = rows[0];
            if (!user || user.employee_status !== '재직' || user.employee_role !== '관리자') {
                return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
            }
            req.adminId = user.employee_id;
            next();
        }).catch(() => res.status(500).json({ message: '권한 확인에 실패했습니다.' }));
}
module.exports = { sign, requireAdmin };
