// server.js가 이 route 배열을 읽어서 app.use( prefix, Router )로 등록한다.
// 실제 API 주소는 prefix와 각 Router 안의 경로를 합쳐서 결정된다.
// 에 : /api/dashboard + /schedules = /api/dashboard/schedules
module.exports = {
  routes: [
    {
      prefix: "/api/dashboard",
      router: require("./dashboard")
    },
    {
      prefix: "/api/notices",
      router: require("./notices")
    },
    {
      prefix: "/api/projects",
      router: require("./projects")
    },
    {
      prefix: "/api/project-events",
      router: require("./projectEvents").router
    },
    {
      // 현재 게시글 API는 junwoo/community.js가 아니라
      // dong/communityService에서 내보낸 posts Router에 연결되어 있다.
      prefix: "/api/community",
      router: require("../dong/communityService").posts
    },
    {
      prefix: "/api/community-comments",
      router: require("./communityReplyService")
    },
    {
      prefix: "/api/community-likes",
      router: require("./communityLikes")
    },
    {
      prefix: "/api/community-bookmarks",
      router: require("./communityBookmarks")
    },
    {
      prefix: "/api/community-comment-counts",
      router: require("./communityCommentCounts")
    },
    {
      prefix: "/api/community-praises",
      router: require("./communityPraises")
    },
    {
      prefix: "/api/dong/project-workload-members",
      router: require("./projectWorkloadMembers")
    }
  ]
};