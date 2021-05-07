"use strict";

const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const Vision = require("@hapi/vision");
const Handlebars = require("handlebars");
const Cookie = require("@hapi/cookie");
require("./app/models/db");
const env = require("dotenv");
const Joi = require("@hapi/joi");
const fs = require('fs');
const https = require("https");

env.config();

const server = Hapi.server({
  port: process.env.PORT || 443,
  tls: {
    key: fs.readFileSync("keys/private/webserver.key"),
    cert: fs.readFileSync("keys/webserver.crt"),
  },
});

const server2 = Hapi.server({
  port: 3000,
  host: 'localhost'
});


async function init() {
  await server.register(Inert);
  await server.register(Vision);
  await server.register(Cookie);
  await server2.register(Inert);
  await server2.register(Vision);
  await server2.register(Cookie);
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
  server.auth.strategy("session", "cookie", {
    cookie: {
      name: process.env.cookie_name,
      password: process.env.cookie_password,
      isSecure: false,
    },
    redirectTo: "/",
  });
  
  server.auth.default("session");

  server.route(require("./routes"));
  server2.route(require("./routes2"));
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
server2.validator(require("@hapi/joi"));

init();
