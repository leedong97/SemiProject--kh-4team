// ===== 우진님 라우터 묶음 =====
// 흩어진 라우터 파일을 한곳에서 "주소 앞부분"과 함께 연결한다.
// server.js 에서는 app.use(require("./woojin")) 한 줄만 쓰면 된다.
const express = require("express");
const router = express.Router();

// router.use("앞부분", 라우터)
//   → 라우터 안에서 "/login" 이라고 쓴 주소가 "/api" + "/login" = "/api/login" 이 된다.
router.use("/api/health", require("./routes/health"));
router.use("/api", require("./routes/auth"));          // /api/login, /api/signup
router.use("/api/schedules", require("./routes/schedules"));
router.use("/api", require("./routes/mypage"));        // /api/leaves, /api/my-...
router.use("/api/profile", require("./routes/profile"));

module.exports = router;
