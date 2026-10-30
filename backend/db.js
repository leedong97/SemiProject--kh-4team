// ===== 공용 DB 연결 풀 (모든 팀원 API가 이 풀 하나를 같이 씁니다) =====
// .env 는 server.js 맨 위에서 먼저 읽기 때문에 여기서는 process.env 만 사용해요.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mydb_v3',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
