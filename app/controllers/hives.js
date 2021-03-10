"use strict";
const Hive = require("../models/hive");
const User = require("../models/user");
const Cloudinary = require('../utils/cloudinary');
const { Exception } = require("handlebars");


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
        try{
          await Cloudinary.createUploadPreset(_id);
        }catch(err){
          console.log(err);
        }
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
        //const images =await  Cloudinary.getAllImages(id.toString());
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
      try {
        await Cloudinary.deleteUploadPreset(test);
      } catch (error) {
        console.log(error);
      }
      try {
        await Cloudinary.deleteResourcesByPrefix(test);
      } catch (error) {
        console.log(error)
      }
      try {
        await Cloudinary.deleteFolder(test);
      } catch (error) {
        console.log(error);
      }
      try {
        const hive = await Hive.findById(deleteHive);
        hive.remove();
        
        return h.view('home', { errors: [{ message: err.message }] });
      } catch (err) {
        return h.view('home');
      }
    },
  },

  images: {
    handler: async function(request, h) {
      try {
        const id = request.params.id.toString();
        const allImages = await Cloudinary.getAllImages(id);
        return h.view('gallery', {
          title: 'Hive Gallery',
          images: allImages
        });
      } catch (err) {
        console.log(err);
      }
    }
  },

  deleteImage: {
    handler: async function(request, h) {
      try {
        const id = request.params.folder;
        const image = request.params.id;
        const imgID = id +"/"+image;
        await Cloudinary.deleteImage(imgID);
        return h.redirect('/images/'+id.toString());
      } catch (err) {
        console.log(err);
      }
    }
  }
  
};

module.exports = Hives;
