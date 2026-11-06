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
            prefix: "/api/project-requests",
            router: require("./projectRequests")
        },
        {
            prefix: "/api/community",
            router: require("../dong/communityService").posts
        },
        {
            prefix: "/api/community-comments",
            router: require("../dong/communityService").comments
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