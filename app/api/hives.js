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
 
  addComment: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      const hive = await Hive.findById(request.params.id);
      const test =hive.details[0].comments ;
      await hive.details.push({ comments: hive.details[0].comments });
      await hive.save();
      if (hive) {
        return { success: true };
      }
      return Boom.notFound("id not found");
    },
  }, 

  deleteComment: {
    auth: {
      strategy: "jwt",
    },
    handler: async function (request, h) {
      const hive = await Hive.findById( request.params.id );
      hive.details.pull({"_id": request.params.comment_id })
      await hive.save();
      if (hive) {
        return { success: true };
      }
      return Boom.notFound("id not found");
    },
  },

};

module.exports = Hives;
