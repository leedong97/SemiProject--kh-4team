const express = require('express');
const db = require('../../db');
const { session, requireUser } = require('../dong/communitySession');
const { wrap, fail, id, errorHandler } = require('./communitySupport');
const router = express.Router();
router.use(session, requireUser);
router.get('/:id', wrap(async (req, res) => {
    const [rows] = await db.query('SELECT a.* FROM community_attachment a JOIN community_post p ON p.id=a.post_id LEFT JOIN community_comment c ON c.id=a.comment_id WHERE a.id=? AND (a.comment_id IS NULL OR c.is_deleted=0)', [id(req.params.id)]);
    if (!rows.length) fail('첨부파일이 없습니다.', 404);
    const f = rows[0]; res.set('X-Content-Type-Options', 'nosniff'); res.set('Cache-Control', 'private, no-store');
    res.set('Content-Type', f.mime_type); res.set('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent(f.original_name)); res.send(f.file_data);
}));

router.use(errorHandler);
module.exports = router;
