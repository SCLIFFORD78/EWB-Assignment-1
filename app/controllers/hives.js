"use strict";
const Hive = require("../models/hive");
const User = require("../models/user");

const Hives = {
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Make a Donation" });
    },
  },
  maps: {
    handler: async function (request, h) {
      const hives = await Hive.find().populate("owner").lean();
      return h.view("maps", {
        title: "hives to Date",
        hives: hives,
      });
    },
  },
  addHive: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const data = request.payload;
        var hiveType = 'Super';
        if(data.radio2 == 'on')hiveType = 'National';
        const newHive = new Hive({
          hiveNumber: data.hiveNumber,
          location: data.location,
          hiveType: hiveType,
          description: data.description,
          owner: user._id,
          details: {comments: data.details} 
        });
        await newHive.save();
        return h.redirect('/maps');
      } catch (err) {
        return h.view('main', { errors: [{ message: err.message }] });
      }
    }
  },

  hiveInfo: {

    handler: async function (request, h) {
      const data = request.payload;
      console.log(data);
      const { id } = request.payload;
      try {
        const hive = await Hive.findById(id).lean();
        console.log(hive);
        return h.view("hive-detail", { title: "Hive Detailed Records", hive: hive });
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }] });
      }
    },
  },
  addComments: {

    handler: async function (request, h) {
      try {
        const data = request.payload;
        const id = data._id;
        const hive = await Hive.findById(id);
        hive.details.push({comments: data.details});
        await hive.save();
        const hiveUpdates = await Hive.findById(id).lean();
        return h.view("hive-detail", { title: "Hive Detailed Records", hive: hiveUpdates });
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }] });
      }
    },
  },
  
};

module.exports = Hives;
