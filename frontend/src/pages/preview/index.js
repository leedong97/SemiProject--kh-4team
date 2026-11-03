import React from "react";

import PreviewLayout from "./PreviewLayout";
import PreviewHome from "./PreviewHome";

import PreviewProjects from "./PreviewProjects";
import PreviewProjectDetail from "./PreviewProjectDetail";

import PreviewNotices from "./PreviewNotices";
import PreviewNoticeDetail from "./PreviewNoticeDetail";

import PreviewIssues from "./PreviewIssues";

console.log("Layout:", typeof PreviewLayout);
console.log("Home:", typeof PreviewHome);
console.log("Projects:", typeof PreviewProjects);
console.log("ProjectDetail:", typeof PreviewProjectDetail);
console.log("Notices:", typeof PreviewNotices);
console.log("NoticeDetail:", typeof PreviewNoticeDetail);
console.log("Issues:", typeof PreviewIssues);

export const previewRoutes = [
    {
        path: "/preview",
        element: <PreviewLayout />,
        children: [
            {
                index: true,
                element: <PreviewHome />
            },
            {
                path: "projects",
                element: <PreviewProjects />
            },
            {
                path: "projects/:id",
                element: <PreviewProjectDetail />
            },
            {
                path: "notices",
                element: <PreviewNotices />
            },
            {
                path: "notices/:id",
                element: <PreviewNoticeDetail />
            },
            {
                path: "issues",
                element: <PreviewIssues />
            }
        ]
    }
];