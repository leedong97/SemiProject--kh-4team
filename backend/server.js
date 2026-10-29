// =====================================================================
//  COMMAND ERP 통합 서버  (B 방식: 메인 서버 1개 + 팀원별 Router 조각)
//
//  - 서버 켜기(listen)는 "여기 한 번"만! members/* 안에서는 listen 하지 않아요.
//  - .env 는 프로젝트 맨 위 폴더(이 backend 폴더의 한 칸 위)에 둡니다.
//  - 포트는 3333 하나. React(3000)는 여기로 요청만 보내요.
//  - 팀원 API 를 추가하려면 members/이름/index.js 의 routes 에 한 줄 넣으면 끝.
// =====================================================================
const path = require('path');
const fs = require('fs');

// 1) 가장 먼저 .env 읽기 (db.js 가 이 값을 쓰기 때문에 반드시 맨 위!)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('[설정 안내] ' + envPath + ' 파일이 없어요. .env.example 을 복사해 .env 로 만들고 DB 정보를 채워주세요.');
  require('dotenv').config(); // 혹시 다른 위치에 있는 경우를 위한 기본 동작
}

const express = require('express');
const cors = require('cors');
const pool = require('./db');

// 2) 팀원 모듈 (각자 { routes: [{ prefix, router }] } 를 내보냄)
const members = {
  woojin: require('./members/woojin'),
  junwoo: require('./members/junwoo'),
  dong: require('./members/dong'),
  heeseung: require('./members/heeseung'),
  jongho: require('./members/jongho'),
};

const app = express();
const PORT = Number(process.env.PORT) || 3333;

// 3) 공통 미들웨어
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((v) => v.trim()) : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// 4) 공통 확인용 주소 (팀원 API 와 겹치지 않는 이름만 사용)
app.get('/api/db-check', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS connected');
    res.json({ message: 'MySQL 연결 성공!', connected: rows[0].connected === 1 });
  } catch (error) {
    console.error('[DB 연결 오류]', error);
    res.status(500).json({ message: 'MySQL 연결 실패' });
  }
});
// ※ /api/health 는 우진 폴더(members/woojin)에 있어요.

// 5) 팀원 Router 연결:  app.use(prefix, router)
const registered = [];
Object.entries(members).forEach(([name, member]) => {
  (member.routes || []).forEach(({ prefix, router }) => {
    app.use(prefix, router);
    registered.push(name + ' -> ' + prefix);
  });
});

// 6) /api 로 시작하는데 아무도 처리하지 않으면 JSON 404 (HTML 로 착각하는 일 방지)
app.use('/api', (req, res) => {
  console.error('[API 경로 없음]', req.method, req.originalUrl);
  res.status(404).json({ message: 'API 경로를 찾을 수 없습니다: ' + req.method + ' ' + req.originalUrl });
});

// 7) (선택) React 빌드 결과(backend/build)가 있으면 같이 제공. 반드시 맨 마지막!
const buildDir = path.join(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir));
  app.use((req, res) => res.sendFile(path.join(buildDir, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('COMMAND ERP 서버 실행 중! (React 는 http://localhost:3000)'));
}

// 8) 서버 켜기 - 파일을 직접 실행했을 때만 (테스트에서 require 하면 켜지지 않음)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log('[서버 실행 성공] http://localhost:' + PORT);
    registered.forEach((line) => console.log('[API 연결] ' + line));
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error('[포트 충돌] ' + PORT + '번 포트를 다른 프로그램이 쓰고 있어요. (이전 서버 창을 닫았는지 확인)');
      console.error('확인: netstat -ano | findstr :' + PORT);
    } else {
      console.error('[서버 실행 오류]', error);
    }
    process.exitCode = 1;
  });
}

module.exports = app;
