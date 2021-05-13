"use strict";

const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const Handlebars = require("handlebars");
const Cookie = require("@hapi/cookie");
require("./app/models/db");
const env = require("dotenv");
const Bell = require("@hapi/bell");
const fs = require("fs");
const https = require("https");
const utils = require("./app/api/utils.js");

env.config();

const server = Hapi.server({
  port: process.env.PORT || 443,
  tls: {
    key: fs.readFileSync("keys/private/webserver.key"),
    cert: fs.readFileSync("keys/webserver.crt"),
  },
});

const server2 = Hapi.server({
  port: 4000,
  routes: { cors: true },
});

async function init() {
  await server.register(Inert);
  await server.register(Vision);
  await server.register([Bell, Cookie]);
  await server2.register(Inert);
  await server2.register(Vision);
  await server2.register(Cookie);
  await server2.register(require("hapi-auth-jwt2"));
  server2.validator(require("@hapi/joi"));
  server.views({
    engines: {
      hbs: require("handlebars"),
    },
    relativeTo: __dirname,
    path: "./app/views",
    layoutPath: "./app/views/layouts",
    partialsPath: "./app/views/partials",
    layout: true,
    isCached: false,
  });
  server2.views({
    engines: {
      hbs: require("handlebars"),
    },
    relativeTo: __dirname,
    path: "./app/views",
    layoutPath: "./app/views/layouts",
    partialsPath: "./app/views/partials",
    layout: true,
    isCached: false,
  });
  server.auth.strategy("cookie-auth", "cookie", {
    cookie: {
      name: "hive_tracker", // Name of auth cookie to be set
      password: "password-should-be-32-characters", // String used to encrypt cookie
      isSecure: true, // Should be 'true' in production software (requires HTTPS)
    },
    redirectTo: "/",
  });
  var bellAuthOptions = {
    provider: "github",
    password: "github-encryption-password-secure", // String used to encrypt cookie
    // used during authorisation steps only
    clientId: "5b5eadd90a0283143c0c", // *** Replace with your app Client Id ****
    clientSecret: "3ca60959c49de91844a190f3e22fd5a7e58e325e", // *** Replace with your app Client Secret ***
    isSecure: true, // Should be 'true' in production software (requires HTTPS)
  };

  server.auth.strategy("github-oauth", "bell", bellAuthOptions);

  server.auth.default("cookie-auth");

  server2.auth.strategy("session", "cookie", {
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false,
    },
    redirectTo: "/",
  });
  server2.auth.strategy("jwt", "jwt", {
    key: "secretpasswordnotrevealedtoanyone",
    validate: utils.validate,
    verifyOptions: { algorithms: ["HS256"] },
  });

  server2.auth.default("session");


  server.route(require("./routes"));
  server2.route(require("./routes2"));
  server2.route(require("./routes-api"));
  await server.start();
  await server2.start();
  console.log(`Server running at: ${server.info.uri}`);
  console.log(`Server running at: ${server2.info.uri}`);
}

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

server.validator(require("@hapi/joi"));

init();
