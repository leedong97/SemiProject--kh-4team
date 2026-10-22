
import React, { useState } from "react";
// React 라이브러리와 상태를 관리하는 useState Hook을 가져온다.

import "../App.css";
// 현재 파일이 있는 pages 폴더에서 한 단계 위(src 폴더)의 App.css를 불러온다.

function Issue_study() {
    // Issue라는 이름의 React 함수형 컴포넌트를 선언한다.

    // ==============================
    // 1. 프로젝트 목록 (임시 데이터)
    // ==============================

    const projects = [
        // projects는 여러 프로젝트 정보를 저장한 객체 배열이다.
        // id는 프로젝트 고유번호, name은 프로젝트 이름이다.

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

    // ==============================
    // 2. 이슈 목록 (임시 데이터)
    // ==============================

    const [issues, setIssues] = useState([
        // issues: 현재 이슈 목록을 저장하는 상태 변수
        // setIssues: issues 상태를 변경하는 함수
        // useState([...]): 초기 이슈 목록을 객체 배열로 설정한다.
        // 상태가 변경되면 React가 컴포넌트를 다시 렌더링한다.

        // id: 이슈 고유번호
        // projectId: 이슈가 속한 프로젝트 ID
        // title: 이슈 제목

        { id: 1, projectId: "P001", title: "통합 고객정보 시스템 로그인 오류" },
        { id: 2, projectId: "P001", title: "고객 데이터베이스 조회 시 지연 발생" },
        { id: 3, projectId: "P001", title: "영업점 통계 데이터 갱신 오류" },
        { id: 4, projectId: "P002", title: "생산관리 시스템 서버 연결 실패" },
        { id: 5, projectId: "P002", title: "재고 수량 데이터 불일치" },
        { id: 6, projectId: "P003", title: "주문 처리 중 결제 오류 발생" }
    ]);

    // ==============================
    // 3. 상태 변수 선언
    // ==============================

    const [selectedProject, setSelectedProject] = useState("");
    // selectedProject: 사용자가 선택한 프로젝트 ID를 저장한다.
    // setSelectedProject: 선택한 프로젝트 ID를 변경하는 함수이다.
    // 초기값 ""는 아무 프로젝트도 선택하지 않은 상태를 의미한다.

    const [search, setSearch] = useState("");
    // search: 사용자가 검색창에 입력한 문자열을 저장한다.
    // setSearch: 검색어를 변경하는 함수이다.
    // 초기값은 빈 문자열이다.

    const [newIssue, setNewIssue] = useState("");
    // newIssue: 사용자가 새로 등록할 이슈 제목을 저장한다.
    // setNewIssue: 새로운 이슈 제목을 변경하는 함수이다.

    // ==============================
    // 4. 프로젝트 선택 이벤트
    // ==============================

    const handleProjectChange = (e) => {
        // 프로젝트 선택창(select)의 값이 변경될 때 실행되는 함수이다.
        // e는 이벤트 객체이며 이벤트가 발생한 요소의 정보를 가지고 있다.

        setSelectedProject(e.target.value);
        // e.target: 이벤트가 발생한 select 요소
        // e.target.value: 사용자가 선택한 option의 value 값
        // 선택한 프로젝트 ID를 selectedProject 상태에 저장한다.

        setSearch("");
        // 프로젝트를 변경하면 기존 검색어를 초기화한다.
    };

    // ==============================
    // 5. 프로젝트 및 이슈 제목 필터링
    // ==============================

    const filteredIssues = issues.filter((issue) => {
        // issues 배열에서 조건을 만족하는 이슈만 추출한다.
        // filter()는 조건이 true인 요소만 모아 새로운 배열을 반환한다.
        // issue는 반복할 때마다 전달받는 이슈 객체 하나이다.

        const projectMatch =
            selectedProject === "" ||
            issue.projectId === selectedProject;

        // projectMatch: 프로젝트 선택 조건을 만족하는지 확인한다.
        //
        // selectedProject === ""
        // → 프로젝트를 선택하지 않았다면 모든 프로젝트를 허용한다.
        //
        // issue.projectId === selectedProject
        // → 현재 이슈의 프로젝트 ID가 선택한 프로젝트 ID와 같은지 확인한다.
        //
        // ||는 OR 연산자이다.
        // 두 조건 중 하나라도 true라면 projectMatch는 true가 된다.

        const titleMatch =
            issue.title.toLowerCase().includes(search.toLowerCase());

        // titleMatch: 이슈 제목에 검색어가 포함되어 있는지 확인한다.
        //
        // issue.title: 현재 이슈의 제목
        //
        // toLowerCase(): 영문을 소문자로 변환한다.
        // → 영문 대소문자를 구분하지 않고 검색하기 위해 사용한다.
        //
        // includes(): 문자열에 특정 검색어가 포함되어 있는지 확인한다.
        // → 포함되어 있다면 true, 없다면 false를 반환한다.

        return projectMatch && titleMatch;
        // &&는 AND 연산자이다.
        // 프로젝트 조건과 제목 검색 조건이 모두 true일 때만
        // 해당 이슈를 filteredIssues 배열에 포함한다.
    });

    // ==============================
    // 6. 새로운 이슈 등록
    // ==============================

    const handleAddIssue = () => {
        // 사용자가 '이슈 등록' 버튼을 클릭했을 때 실행된다.

        if (selectedProject === "") {
            // 프로젝트가 선택되지 않았는지 확인한다.

            alert("프로젝트를 먼저 선택해주세요.");
            // 프로젝트를 선택하지 않았다면 경고창을 출력한다.

            return;
            // 함수를 즉시 종료하여 아래 등록 코드가 실행되지 않도록 한다.
        }

        if (newIssue.trim() === "") {
            // 사용자가 입력한 이슈 제목이 비어 있는지 확인한다.
            // trim()은 문자열 앞뒤의 공백을 제거한다.
            // 공백만 입력한 경우에도 빈 문자열로 판단한다.

            alert("이슈 제목을 입력해주세요.");
            // 이슈 제목이 비어 있으면 경고창을 출력한다.

            return;
            // 함수를 즉시 종료한다.
        }

        const issue = {
            // 새롭게 등록할 이슈 정보를 객체로 생성한다.

            id: Date.now(),
            // 현재 시간을 밀리초 단위의 숫자로 반환하여 ID로 사용한다.
            // 임시 ID 생성 방식이며 DB에서는 별도 고유번호를 사용하는 것이 좋다.

            projectId: selectedProject,
            // 사용자가 선택한 프로젝트 ID를 새 이슈에 저장한다.

            title: newIssue.trim()
            // 입력한 이슈 제목에서 앞뒤 공백을 제거하여 저장한다.
        };

        setIssues([...issues, issue]);
        // 기존 issues 배열에 새로운 issue 객체를 추가한다.
        //
        // ...issues: 기존 배열의 요소들을 펼치는 전개 연산자이다.
        // issue: 새롭게 생성한 이슈 객체이다.
        //
        // [...issues, issue]
        // → 기존 이슈는 유지하고 새 이슈를 마지막에 추가한 새 배열이다.
        //
        // React에서는 기존 상태 배열을 직접 수정하지 않고
        // 새 배열을 만들어 setIssues()로 변경한다.

        setNewIssue("");
        // 이슈 등록이 완료되면 입력창을 빈 문자열로 초기화한다.
    };

    // ==============================
    // 7. 검색 조건 초기화
    // ==============================

    const handleReset = () => {
        // '전체 표시' 버튼을 클릭했을 때 실행되는 함수이다.

        setSelectedProject("");
        // 선택한 프로젝트를 초기화하여 전체 프로젝트를 조회한다.

        setSearch("");
        // 검색어도 초기화하여 전체 이슈가 표시되도록 한다.
    };

    // ==============================
    // 8. JSX 화면 출력
    // ==============================

    return (
        // React 컴포넌트가 화면에 출력할 JSX를 반환한다.

        <main className="issue-page">
            {/* 이슈 페이지 전체를 감싸는 main 태그이다. */}
            {/* className은 CSS 클래스를 지정할 때 사용한다. */}

            {/* ============================== */}
            {/* 9. 페이지 제목 영역 */}
            {/* ============================== */}

            <div className="issue-header">
                {/* 제목과 전체 표시 버튼을 배치하는 영역이다. */}

                <div>
                    <h1>SI 프로젝트 이슈 목록</h1>
                    {/* 페이지의 메인 제목이다. */}

                    <p>
                        프로젝트별 이슈를 조회하고 관리할 수 있습니다.
                    </p>
                    {/* 페이지에 대한 간단한 설명이다. */}
                </div>

                <button
                    className="issue-reset"
                    onClick={handleReset}
                >
                    {/* onClick은 버튼 클릭 시 실행할 함수를 지정한다. */}
                    {/* 클릭하면 handleReset 함수가 실행된다. */}

                    검색 리셋
                </button>
            </div>

            {/* ============================== */}
            {/* 10. 프로젝트 및 이슈 개수 */}
            {/* ============================== */}

            <div className="issue-summary">
                {/* 전체 프로젝트 수와 현재 조회된 이슈 수를 표시한다. */}

                <span>전체 프로젝트 {projects.length}개</span>
                {/* projects.length는 프로젝트 배열의 요소 개수를 반환한다. */}

                <span>조회된 이슈 {filteredIssues.length}개</span>
                {/* filteredIssues.length는 필터링된 이슈의 개수를 반환한다. */}
            </div>

            {/* ============================== */}
            {/* 11. 프로젝트 선택 및 검색 */}
            {/* ============================== */}

            <section className="issue-filter">
                {/* 프로젝트 선택창과 이슈 제목 검색창을 감싸는 영역이다. */}

                <label htmlFor="project-select">
                    프로젝트 선택
                </label>
                {/* htmlFor는 연결할 입력 요소의 id를 지정한다. */}

                <select
                    id="project-select"
                    value={selectedProject}
                    onChange={handleProjectChange}
                >
                    {/* select는 여러 항목 중 하나를 선택하는 태그이다. */}
                    {/* value에는 현재 선택한 프로젝트 ID가 들어간다. */}
                    {/* onChange는 선택값이 변경될 때 함수를 실행한다. */}

                    <option value="">전체 프로젝트</option>
                    {/* value가 빈 문자열이면 전체 프로젝트를 의미한다. */}

                    {projects.map((project) => (
                        // map()은 projects 배열을 순회한다.
                        // 각 프로젝트 객체를 option 태그로 변환한다.
                        // project는 현재 순회 중인 프로젝트 객체이다.

                        <option
                            key={project.id}
                            value={project.id}
                        >
                            {/* key는 React가 각 항목을 구별하기 위한 값이다. */}
                            {/* value는 선택 시 저장되는 프로젝트 ID이다. */}

                            {project.id} - {project.name}
                            {/* 프로젝트 ID와 프로젝트 이름을 화면에 출력한다. */}
                        </option>
                    ))}
                </select>

                <label htmlFor="issue-search">
                    이슈 제목 검색
                </label>

                <input
                    id="issue-search"
                    type="text"
                    placeholder="이슈 제목 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {/* type="text": 일반 문자열 입력창이다. */}
                {/* placeholder: 입력 전 표시되는 안내 문구이다. */}
                {/* value={search}: 현재 상태값을 입력창에 표시한다. */}
                {/* onChange: 사용자가 입력할 때마다 실행된다. */}
                {/* e.target.value: 입력창에 현재 입력된 문자열이다. */}
                {/* setSearch(): 입력값을 search 상태에 저장한다. */}

            </section>

            {/* ============================== */}
            {/* 12. 새로운 이슈 등록 */}
            {/* ============================== */}

            <section className="issue-register">
                {/* 새로운 이슈를 등록하는 영역이다. */}

                <h3>새로운 이슈 등록</h3>

                <div className="issue-register-form">

                    <input
                        type="text"

                        placeholder={
                            selectedProject
                                ? "새 이슈 제목을 입력하세요"
                                : "프로젝트를 먼저 선택해주세요"
                        }
                        // 삼항 연산자로 placeholder 문구를 결정한다.
                        // selectedProject에 프로젝트 ID가 있으면 첫 번째 문구,
                        // 빈 문자열이면 두 번째 문구를 표시한다.

                        value={newIssue}
                        // newIssue 상태값을 입력창에 표시한다.

                        onChange={(e) => setNewIssue(e.target.value)}
                        // 입력값이 변경되면 setNewIssue로 상태를 업데이트한다.
                    />

                    <button onClick={handleAddIssue}>
                        {/* 버튼 클릭 시 handleAddIssue 함수를 실행한다. */}

                        + 이슈 등록
                    </button>
                </div>

            </section>

            {/* ============================== */}
            {/* 13. 이슈 목록 테이블 */}
            {/* ============================== */}

            <section className="issue-list-section">
                {/* 이슈 목록을 출력하는 영역이다. */}

                <div className="issue-list-header">

                    <h3>이슈 목록</h3>

                    <span>{filteredIssues.length}건</span>
                    {/* 현재 필터링된 이슈 개수를 표시한다. */}
                </div>

                <table className="issue-table">
                    {/* 이슈 데이터를 표 형태로 출력한다. */}

                    <thead>
                        {/* 테이블의 제목 행 영역이다. */}

                        <tr>
                            {/* 테이블의 한 행을 의미한다. */}

                            <th>이슈 ID</th>
                            <th>프로젝트</th>
                            <th>이슈 제목</th>
                            {/* th는 테이블의 제목 셀이다. */}
                        </tr>
                    </thead>

                    <tbody>
                        {/* 테이블의 실제 데이터가 출력되는 영역이다. */}

                        {filteredIssues.length > 0 ? (
                            // 삼항 연산자로 출력할 내용을 결정한다.
                            // 조회된 이슈가 1개 이상이면 map()을 실행한다.

                            filteredIssues.map((issue) => {
                                // filteredIssues 배열을 순회한다.
                                // issue에는 이슈 객체가 하나씩 전달된다.

                                const project = projects.find(
                                    (p) => p.id === issue.projectId
                                );
                                // find()는 조건을 만족하는 첫 번째 요소를 반환한다.
                                // 현재 이슈의 projectId와 일치하는 프로젝트를 찾는다.
                                // p는 projects 배열의 각 프로젝트 객체이다.
                                // 해당 프로젝트가 없으면 undefined를 반환한다.

                                return (
                                    // map()에서 각각의 이슈를 tr 태그로 반환한다.

                                    <tr key={issue.id}>
                                        {/* 이슈 하나당 테이블 행 하나를 생성한다. */}
                                        {/* key는 각 행을 구별하기 위한 고유값이다. */}

                                        <td>
                                            {`ISS-${String(issue.id).padStart(3, "0")}`}
                                        </td>
                                        {/* td는 테이블의 일반 데이터 셀이다. */}
                                        {/* String()은 숫자 ID를 문자열로 변환한다. */}
                                        {/* padStart(3, "0")은 최소 3자리까지 앞에 0을 추가한다. */}
                                        {/* 예: 1 → 001, 최종 출력은 ISS-001 */}
                                        {/* Date.now()로 생성된 긴 ID는 그대로 출력된다. */}

                                        <td>
                                            {project?.name || "-"}
                                        </td>
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
                                <td colSpan="3" className="issue-empty">
                                    {/* colSpan="3"은 3개 열을 하나의 셀로 합친다. */}

                                    조회된 이슈가 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

            </section>

            {/* ============================== */}
            {/* 14. 페이지 하단 설명 */}
            {/* ============================== */}

            <p className="issue-footer">
                프로젝트를 선택하면 해당 프로젝트의 이슈만 표시됩니다.
            </p>
            {/* 사용자에게 필터링 기능을 안내하는 문구이다. */}

        </main>
    );
}

// 다른 파일에서 Issue 컴포넌트를 import할 수 있도록 내보낸다.
export default Issue_study;
