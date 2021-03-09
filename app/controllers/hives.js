"use strict";
const Hive = require("../models/hive");
const User = require("../models/user");
const app = require("../models/cloudinary");
const cloudinary = require('cloudinary').v2;
const { Exception } = require("handlebars");

require('dotenv').config();



// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});



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
        hives: hives

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
          latitude: data.latitude,
          longtitude: data.longtitude,
          hiveType: hiveType,
          description: data.description,
          owner: user._id,
          details: {comments: data.details} 
        });
        await newHive.save();
        var  _id  = newHive._id.toString();
        cloudinary.api.create_upload_preset({name:_id, unsigned:true, folder:_id, tags:_id});
        return h.redirect('/maps');
      } catch (err) {
        return h.view('home', { errors: [{ message: err.message }] });
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
  deleteHive: {

    handler: async function (request, h) {
      const data = request.payload;
      console.log(data);
      const { deleteHive } = request.payload;
      const test = deleteHive.toString();
      console.log(deleteHive);
      console.log(test);
      await cloudinary.api.delete_upload_preset(test);
      await cloudinary.api.delete_resources_by_prefix(test,console.log);
      await cloudinary.api.delete_folder(test,console.log);

      try {
        const hive = await Hive.findById(deleteHive);
        hive.remove();
        
        return h.view('home', { errors: [{ message: err.message }] });
      } catch (err) {
        return h.view('home');
      }
    },
  },
  
};

module.exports = Hives;
