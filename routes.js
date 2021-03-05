"use strict";

const Accounts = require("./app/controllers/accounts");
const Hives = require("./app/controllers/hives");

module.exports = [
  { method: "GET", path: "/", config: Accounts.index },
  { method: "GET", path: "/signup", config: Accounts.showSignup },
  { method: "GET", path: "/login", config: Accounts.showLogin },
  { method: "GET", path: "/logout", config: Accounts.logout },
  { method: "POST", path: "/signup", config: Accounts.signup },
  { method: "POST", path: "/login", config: Accounts.login },
  { method: 'GET', path: '/settings', config: Accounts.showSettings },
  { method: 'POST', path: '/settings', config: Accounts.updateSettings },

  { method: "GET", path: "/home", config: Hives.home },
  { method: "POST", path: "/addHive", config: Hives.addHive },
  { method: "GET", path: "/maps", config: Hives.maps },
  { method: "POST", path: "/hive-info", config: Hives.hiveInfo },
  { method: "POST", path: "/addComment", config: Hives.addComments },

  {
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "./public",
      },
    },
    options: { auth: false },
  },
];
