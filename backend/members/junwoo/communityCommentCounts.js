const express = require("express");
const db = require("../../db");

const {
    session,
    requireUser,
} = require("../dong/communitySession");

const router = express.Router();

// 게시글별 댓글·답글 수 조회
router.get("/", session, requireUser, async function (req, res) {
    try {
        const [rows] = await db.query(
            `SELECT
                post_id AS postId,
                COUNT(*) AS commentCount
             FROM community_comment
             WHERE is_deleted = 0
             GROUP BY post_id`
        );

        res.set("Cache-Control", "no-store");

        res.json(
            rows.map(function (row) {
                return {
                    postId: row.postId,
                    commentCount: Number(row.commentCount),
                };
            })
        );
    } catch (error) {
        console.error("댓글 수 조회 오류:", error);

        res.status(500).json({
            message: "댓글 수를 불러오지 못했습니다.",
        });
    }
});

module.exports = router;