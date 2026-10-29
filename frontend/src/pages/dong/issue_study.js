
import React, { useState } from "react";

function Issue_study() {
    
    const projects = [     

        { id: "P001", name: "KB국민은행" },
        { id: "P002", name: "삼성전자" },
        { id: "P003", name: "쿠팡" },
        { id: "P004", name: "서울대학교병원" },
        { id: "P005", name: "대한항공" },
        { id: "P006", name: "현대자동차" },
        { id: "P007", name: "CJ대한통운" },
        { id: "P008", name: "신세계백화점" },
        { id: "P009", name: "한국전력공사" },
        { id: "P010", name: "서울특별시" }
    ];

    const [issues, setIssues] = useState([     

        { id: 1, projectId: "P001", title: "통합 고객정보 시스템 로그인 오류" },
        { id: 2, projectId: "P001", title: "고객 데이터베이스 조회 시 지연 발생" },
        { id: 3, projectId: "P001", title: "영업점 통계 데이터 갱신 오류" },
        { id: 4, projectId: "P002", title: "생산관리 시스템 서버 연결 실패" },
        { id: 5, projectId: "P002", title: "재고 수량 데이터 불일치" },
        { id: 6, projectId: "P003", title: "주문 처리 중 결제 오류 발생" }
    ]);

  
    const [selectedProject, setSelectedProject] = useState(""); 
    const [search, setSearch] = useState("");
    const [newIssue, setNewIssue] = useState("");
    const handleProjectChange = (e) => {     
        setSelectedProject(e.target.value);
        setSearch("");
    };

    const filteredIssues = issues.filter((issue) => {
        const projectMatch =
            selectedProject === "" ||
            issue.projectId === selectedProject;     

        const titleMatch =
            issue.title.toLowerCase().includes(search.toLowerCase()); 
        return projectMatch && titleMatch;       
    });  

    const handleAddIssue = () => {    
        if (selectedProject === "") {           
            alert("프로젝트를 먼저 선택해주세요.");          
            return;        
        }

        if (newIssue.trim() === "") {     
            alert("이슈 제목을 입력해주세요.");         
            return;
         }

        const issue = {
            id: Date.now(),        
            projectId: selectedProject,        
            title: newIssue.trim()         
        };

        setIssues([...issues, issue]); 
        setNewIssue("");      
    };   
    const handleReset = () => {      
        setSelectedProject("");    
        setSearch("");      
    };

    // ==============================
    // JSX 화면 출력
    // ==============================

    return (
    

        <main className="issue-page">  
            <div className="issue-header">
                <div>
                    <h1>SI 프로젝트 이슈 목록</h1>
                    <p>
                        프로젝트별 이슈를 조회하고 관리할 수 있습니다.
                    </p>                   
                </div>

                <button className="issue-reset" onClick={handleReset}>    
                    검색 리셋
                </button>
            </div>        

            <div className="issue-summary">
                <span>전체 프로젝트 {projects.length}개</span>
                <span>조회된 이슈 {filteredIssues.length}개</span>
            </div>
            <section className="issue-filter">
                <label htmlFor="project-select">
                    프로젝트 선택
                </label>        
                <select id="project-select" value={selectedProject} onChange={handleProjectChange}>
                    <option value="">전체 프로젝트</option>
                    {/* value가 빈 문자열이면 전체 프로젝트를 의미한다. */}

                    {projects.map((project) => (                   
                        <option key={project.id} value={project.id}>                 
                            {project.id} - {project.name}                
                        </option>
                    ))}
                </select>

                <label htmlFor="issue-search"> 이슈 제목 검색 </label>
                <input id="issue-search" type="text" placeholder="이슈 제목 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </section>

            <section className="issue-register">
                <h3>새로운 이슈 등록</h3>
                <div className="issue-register-form">
                    <input type="text" placeholder={selectedProject ? "새 이슈 제목을 입력하세요": "프로젝트를 먼저 선택해주세요"}            
                        value={newIssue} onChange={(e) => setNewIssue(e.target.value)}/>

                    <button onClick={handleAddIssue}>이슈 건의요청</button>
                </div>
            </section>
            <section className="issue-list-section">             
                <div className="issue-list-header">
                    <h3>이슈 목록</h3>
                    <span>{filteredIssues.length}건</span>
                </div>

                <table className="issue-table">
                    <thead>
                        <tr>
                            <th>이슈 ID</th>
                            <th>프로젝트</th>
                            <th>이슈 제목</th>                    
                        </tr>
                    </thead>

                    <tbody>                       
                        {filteredIssues.length > 0 ? (filteredIssues.map((issue) => {
                                const project = projects.find(
                                    (p) => p.id === issue.projectId
                                );   
                                return (                                   
                                    <tr key={issue.id}>
                                        {/* key는 각 행을 구별하기 위한 고유값이다. */}
                                        <td>{`ISS-${String(issue.id).padStart(3, "0")}`}</td>
                                        {/* td는 테이블의 일반 데이터 셀이다. */}
                                        {/* String()은 숫자 ID를 문자열로 변환한다. */}
                                        {/* padStart(3, "0")은 최소 3자리까지 앞에 0을 추가한다. */}
                                        {/* 예: 1 → 001, 최종 출력은 ISS-001 */}
                                        {/* Date.now()로 생성된 긴 ID는 그대로 출력된다. */}

                                        <td> {project?.name || "-"}</td>
                                        {/* project?.name은 프로젝트가 존재할 때만 name을 읽는다. */}
                                        {/* ?.는 옵셔널 체이닝 연산자이다. */}
                                        {/* 프로젝트를 찾지 못하면 "-"를 출력한다. */}

                                        <td>{issue.title}</td>
                                        {/* 현재 이슈의 제목을 출력한다. */}
                                    </tr>
                                );
                            })
                        ) : (
                            // filteredIssues 배열이 비어 있다면 아래 행을 출력한다.
                            <tr>
                                <td colSpan="3" className="issue-empty">조회된 이슈가 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
            <p className="issue-footer">프로젝트를 선택하면 해당 프로젝트의 이슈만 표시됩니다.</p>  
        </main>
    );
}

export default Issue_study;
