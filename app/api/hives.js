"use strict";

const Hive = require("../models/hive");
const Boom = require("@hapi/boom");
const utils = require("./utils.js");


const Hives = {
  find: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      const hives = await Hive.find();
      return hives;
    },
  },

  findOne: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      try {
        const hive = await Hive.findOne({ _id: request.params.id });
        if (!hive) {
          return Boom.notFound("No hive with this id");
        }
        return hive;
      } catch (err) {
        return Boom.notFound("No hive with this id");
      }
    },
  },

  create: {
    auth: false,
    handler: async function (request, h) {
      const newHive = new Hive(request.payload);
      const hive = await newHive.save();
      if (hive) {
        return h.response(hive).code(201);
      }
      return Boom.badImplementation("error creating hive");
    },
  },

  deleteAll: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      await Hive.deleteMany({});
      return { success: true };
    },
  },

  deleteOne: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      const hive = await Hive.deleteOne({ _id: request.params.id });
      if (hive) {
        return { success: true };
      }
      return Boom.notFound("id not found");
    },
  },
/* 
  update: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      const hiveEdit = request.payload;
      const hive = await Hive.findById(hiveEdit._id);
      hive.firstName = hiveEdit.firstName;
      hive.lastName = hiveEdit.lastName;
      hive.email = hiveEdit.email;
      hive.password = hiveEdit.password;
      await hive.save();
      if (hive) {
        return { success: true };
      }
      return Boom.notFound("id not found");
    },
  }, */

};

module.exports = Hives;
