// Express 서버의 주소입니다. React 포트(3000/3001)가 아닙니다.
const SERVER_URL = (process.env.REACT_APP_API_URL || "http://localhost:3333").replace(/\/$/, "");
const API_URL = SERVER_URL + "/api/notices";

// 서버가 JSON 대신 HTML 오류 페이지를 반환해도 상태와 주소를 확인합니다.
async function checkResponse(response) {
    const raw = await response.text();
    let data = {};

    try {
        data = raw ? JSON.parse(raw) : {};
    } catch (error) {
        data = {};
    }

    if (!response.ok) {
        console.error("[공지사항 API 오류]", response.status, response.url, raw);
        throw new Error(
            data.message ||
            `공지사항 요청 오류: ${response.status} (${response.url})`
        );
    }

    return data;
}

export async function getNotices() {
    return checkResponse(await fetch(API_URL));
}

export async function createNotice(title, content, important, employeeId) {
    return checkResponse(await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, important, employee_id: employeeId })
    }));
}

export async function editNotice(id, title, content, important) {
    return checkResponse(await fetch(API_URL + "/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, important })
    }));
}

export async function deleteNotice(id) {
    return checkResponse(await fetch(API_URL + "/" + id, {
        method: "DELETE" }
    ));
}

export async function increaseNoticeViews(id) {
    return checkResponse(await fetch(API_URL + "/" + id + "/views", {
        method: "PATCH"
    }));
}
