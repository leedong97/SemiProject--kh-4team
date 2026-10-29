const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());
//-----------------------------------------------------------------

const db = mysql.createConnection({
    host: "127.0.0.1", 
    port: 3306,
    user:"myuser", 
    password:'1111', 
    database:'mydb_v3' 
})

// db.connect();

db.connect((err)=>{
    // 여기서 err은 myslq2 라이브러리에서 제공하는 콜백함수에 전달하는 매개변수이다.
    // 보통 연결이 되지않는다면 Error 객체를 넘기기 때문에 null이 아니다 그래서 아래 조건식이 되는것이다.
    if(err){
        console.log("DB연결 실패")
    }else{
        console.log("DB연결 성공")
    }
})

//aws 서버측에서 사용할 경로
// 뒤에서 require("path")는 path모듈을 불러오는것이고
// path 모듈은 파일이나 폴더의 경로를 다룰때 사용한다.
const path = require("path");
app.use( express.static( path.join(__dirname, "build") ) );


// =====================================================
// 프로젝트 조회 API
// =====================================================
app.get("/api/projects", (req, res) => {
    const sql = `
        SELECT
            p.project_id AS id,
            p.project_title AS name,
            c.customer_name AS customerName
        FROM projects p
        LEFT JOIN customers c
            ON p.customer_id = c.customer_id
        ORDER BY p.project_id
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("프로젝트 조회 실패:", err);
            return res.status(500).json({
                message: "프로젝트 조회 실패"
            });
        }

        res.json(rows);
    });
});


// =====================================================
// 이슈 조회 API
// =====================================================
app.get("/api/issues", (req, res) => {
    const sql = `
        SELECT
            i.issue_id AS id,
            i.project_id AS projectId,
            i.issue_title AS title,
            i.issue_description AS description,
            i.issue_priority AS priority,
            i.issue_status AS status,
            i.issue_created_at AS createdAt,

            e.employee_id AS reporterId,
            e.employee_name AS reporterName,
            e.employee_grade AS reporterGrade,
            e.employee_phone AS reporterPhone,

            p.project_title AS projectName,
            c.customer_name AS customerName

        FROM issues i

        LEFT JOIN employees e
            ON i.reporter_id = e.employee_id

        LEFT JOIN projects p
            ON i.project_id = p.project_id

        LEFT JOIN customers c
            ON p.customer_id = c.customer_id

        ORDER BY i.issue_id
    `;

    db.query(sql, (err, rows) => {
        if (err) {
            console.error("이슈 조회 실패:", err);
            return res.status(500).json({
                message: "이슈 조회 실패"
            });
        }

        res.json(rows);
    });
});


// =====================================================
// React 정적 파일 및 페이지 라우트
// API보다 아래에 있어야 한다.
// =====================================================




app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});


// React 개발 서버가 3000번을 사용하므로
// 백엔드는 3333번 사용을 권장한다.
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`백엔드 서버 실행 중: ${PORT}`);
});

app.use(express.static(path.join(__dirname, "build")));



// 3333번 포트와의 연결이 제대로 되면 console이 뜨게한다.
app.listen(PORT, () => {
    console.log("연결중....");
});
