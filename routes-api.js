const Hives = require("./app/api/hives");
const Users = require("./app/api/users");


module.exports = [
  { method: "GET", path: "/api/hives", config: Hives.find },
  { method: "GET", path: "/api/hives/{id}", config: Hives.findOne },
  { method: "POST", path: "/api/hives", config: Hives.create },
  { method: "DELETE", path: "/api/hives/{id}", config: Hives.deleteOne },
  { method: "DELETE", path: "/api/hives", config: Hives.deleteAll },
  { method: "POST", path: "/api/hives/addComment/{id}", config: Hives.addComment },
  { method: "DELETE", path: "/api/hives/deleteComment/{id}/{comment_id}", config: Hives.deleteComment },

  { method: "GET", path: "/api/users", config: Users.find },
  { method: "GET", path: "/api/users/{id}", config: Users.findOne },
  { method: "POST", path: "/api/users", config: Users.create },
  { method: "DELETE", path: "/api/users/{id}", config: Users.deleteOne },
  { method: "DELETE", path: "/api/users", config: Users.deleteAll },
  { method: "PUT", path: "/api/users/{id}", config: Users.update },




  { method: "POST", path: "/api/users/authenticate", config: Users.authenticate },
];
