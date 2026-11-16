import { compareText, compareNumber, compareDate, descending, sortByOption } from "../pages/jongho/utils/listSort";
import "./ListSort.css";

const options = {
    project: [["default", "기본순"], ["title", "프로젝트명순"], ["customer", "고객사순"], ["status", "상태순"], ["manager", "담당자순"], ["endDate", "종료일 빠른순"], ["progress", "진행률 높은순"]],
    issue: [["default", "기본순"], ["latest", "최신순"], ["title", "제목순"], ["project", "프로젝트명순"], ["status", "상태순"], ["assignee", "담당자순"], ["priority", "우선순위 높은순"]],
    notice: [["default", "기본순"], ["latest", "최신순"], ["title", "제목순"], ["department", "작성 부서순"], ["views", "조회수 높은순"]],
    community: [["default", "기본순"], ["latest", "최신순"], ["title", "제목순"], ["author", "작성자순"], ["comments", "댓글 많은순"]]
};

export function sortList(items, option) {
    const priority = { "긴급": 4, "높음": 3, "보통": 2, "낮음": 1 };
    return sortByOption(items, option, {
        default: (a,b) => compareNumber(a.id,b.id),
        latest: (a,b) => compareNumber(b.id,a.id),
        title: (a,b) => compareText(a.title,b.title),
        customer: (a,b) => compareText(a.customerName,b.customerName),
        status: (a,b) => compareText(a.status,b.status),
        manager: (a,b) => compareText(a.managerName,b.managerName),
        assignee: (a,b) => compareText(a.assigneeName,b.assigneeName),
        project: (a,b) => compareText(a.projectName,b.projectName),
        department: (a,b) => compareText(a.authorDepartment,b.authorDepartment),
        author: (a,b) => compareText(a.authorName ?? a.author,b.authorName ?? b.author),
        endDate: (a,b) => compareDate(a.endDate,b.endDate),
        progress: descending((a,b) => compareNumber(a.progress,b.progress)),
        views: descending((a,b) => compareNumber(a.views,b.views)),
        comments: descending((a,b) => compareNumber(a.commentCount,b.commentCount)),
        priority: (a,b) => (priority[b.priority] || 0) - (priority[a.priority] || 0)
    });
}

export default function ListSort({ kind, value, onChange }) {
    return <div className="general-list-sort">
        <label htmlFor={kind + "-list-sort"}>정렬 기준</label>
        <select id={kind + "-list-sort"} value={value} onChange={event => onChange(event.target.value)}>
            {options[kind].map(([key,label]) => <option key={key} value={key}>{label}</option>)}
        </select>
    </div>;
}
