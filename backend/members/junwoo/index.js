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
      prefix: "/api/community",
      router: require("./community")
    },
    {
      prefix: "/api/community-comments",
      router: require("./communityComments")
    },
    {
      prefix: "/api/community-likes",
      router: require("./communityLikes")
    }
  ]
};