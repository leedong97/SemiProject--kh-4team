require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// 멤버별 폴더(members/이름)의 index.js 를 가져옵니다.
// 각 폴더는 routes 배열 [{ prefix, router }] 만 내보내면 됩니다. server.js 는 안 고쳐도 돼요.
const woojin = require('./members/woojin');
const heeseung = require('./members/heeseung');
const dong = require('./members/dong');
const junwoo = require('./members/junwoo');
const jongho = require('./members/jongho');

const members = [woojin, heeseung, dong, junwoo, jongho];

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// DB 연결 확인
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// 멤버별 API 연결
members.forEach((m) => {
  (m.routes || []).forEach(({ prefix, router }) => app.use(prefix, router));
});

// React 빌드 결과(build 폴더)가 있을 때만 정적 파일 서빙
// 라우트 등록은 반드시 API 뒤에 둬야 /login 등이 가려지지 않음
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API 서버 실행: http://localhost:${PORT}`);
});
