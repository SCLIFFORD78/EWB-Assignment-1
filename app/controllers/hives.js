"use strict";
const Hive = require("../models/hive");
const User = require("../models/user");
const Cloudinary = require("../utils/cloudinary");
const Weather = require("../utils/weather");
const { Exception } = require("handlebars");
const Joi = require('@hapi/joi');

const Hives = {
  
  home: {
    handler: function (request, h) {
      return h.view("home", { title: "Make a Donation" });
    },
  },
  maps: {
    handler: async function (request, h) {
      const response = request.payload;
      var hives = "";
      var filter = "";
      if (response)
        if (response["National"] == "on" && response["Super"] == "on") {
          hives = await Hive.find({}).lean();
          filter = "ALL Catagories displayed. Select hive type to filter";
        } else if (response["National"] == "on") {
          hives = await Hive.find({ hiveType: "National" }).lean();
          filter = "NATIONAL HIVES displayed. Select hive type to filter";
        } else if (response["Super"] == "on") {
          hives = await Hive.find({ hiveType: "Super" }).lean();
          filter = "SUPER HIVES displayed. Select hive type to filter";
        } else {
          hives = await Hive.find({}).lean();
          filter = "ALL Catagories displayed. Select hive type to filter";
        }
      else {
        hives = await Hive.find({}).lean();
        filter = "ALL Catagories displayed. Select hive type to filter";
      }
      return h.view("maps", {
        title: "hives to Date",
        hives: hives,
        filter: filter,
      });
    },
  },
  addHive: {
    validate: {
      payload: {
        comments: Joi.string().required(),
        description: Joi.string().required(),
        latitude: Joi.number().required(),
        longtitude: Joi.number().required().negative(),
        radio2: Joi.any()
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("home", {
            title: "Sign in error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        const data = request.payload;
        var hiveType = "National";
        if (data.radio2 == "on") hiveType = "Super";
        const newHive = new Hive({
          latitude: data.latitude,
          longtitude: data.longtitude,
          hiveType: hiveType,
          description: data.description,
          owner: user._id,
          details: { comments: data.comments },
        });
        await newHive.save();
        var _id = newHive._id.toString();
        try {
          await Cloudinary.createUploadPreset(_id);
        } catch (err) {
          console.log(err);
        }
        return h.redirect("/maps");
      } catch (err) {
        return h.view("home", { errors: [{ message: err.message }] });
      }
    },
  },

  hiveInfo: {
    handler: async function (request, h) {
      const { id } = request.payload;

      try {
        const hive = await Hive.findById(id).lean();
        for (var i = 0; i < hive.details.length;i++){
          hive.details[i].dateLogged = hive.details[i].dateLogged.toDateString()
        };
        const weather = await Weather.fetchWeather(hive.latitude, hive.longtitude);
        return h.view("hive-detail", { title: "Hive Detailed Records", hive: hive , weather: weather});
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
        hive.details.push({ comments: data.details });
        await hive.save();
        const hiveUpdates = await Hive.findById(id).lean();
        const weather = await Weather.fetchWeather(hive.latitude, hive.longtitude);
        return h.view("hive-detail", { title: "Hive Detailed Records", hive: hiveUpdates, weather: weather });
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }] });
      }
    },
  },
  deleteComment: {
    handler: async function (request, h) {
      const { _id } = request.payload;
      var hive1 = '';
      var weather = '';
      try {
        const loggedInUserID = request.auth.credentials.id;
        const loggedInUser = await User.findById(loggedInUserID).lean();
        const hive = await Hive.find({ "details._id": _id }).lean();
        const hiveID = hive[0]["_id"].toString();
        hive1 = await Hive.findById(hiveID).lean();
        weather = await Weather.fetchWeather(hive1.latitude, hive1.longtitude);
        if (hive1.owner.toString() == loggedInUserID || loggedInUser.admin) {
          var details = hive1.details;
          var newDetails = [];
          for (var i = 0; i < details.length; i++) {
            if (details[i]["_id"].toString() != _id) newDetails.push(details[i]);
          }
          const filter = { _id: hiveID };
          const update = { details: newDetails };
          let newComments = await Hive.findOneAndUpdate(filter, update, { new: true });
          const hive2 = await Hive.findById(hiveID).lean();
          return h.view("hive-detail", { title: "Hive Detailed Records", hive: hive2, weather: weather });
        } else {
          return h.view("hive-detail", {
            title: "Hive Detailed Records",
            errors: [{ message: "No Authority to delete. Must be owner or admin!" }],
            hive: hive1,
            weather: weather
          });
        }
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }], hive: hive1, weather: weather });
      }
    },
  },

  deleteHive: {
    handler: async function (request, h) {
      const loggedInUserID = request.auth.credentials.id;
      const loggedInUser = await User.findById(loggedInUserID).lean();
      const { deleteHive } = request.payload;
      const hive = await Hive.findById(deleteHive);
      if (hive.owner.toString() == loggedInUserID || loggedInUser.admin) {
        try {
          await Cloudinary.deleteUploadPreset(deleteHive);
        } catch (error) {
          console.log(error);
        }
        try {
          await Cloudinary.deleteResourcesByPrefix(deleteHive);
        } catch (error) {
          console.log(error);
        }
        try {
          await Cloudinary.deleteFolder(deleteHive);
        } catch (error) {
          console.log(error);
        }
        try {
          hive.remove();

          return h.view("home", { errors: [{ message: err.message }] });
        } catch (err) {
          return h.view("home");
        }
      } else {
        return h.view("home", { errors: [{ message: "No Authority to delete. Must be owner or admin!" }] });
      }
    },
  },
  editLocation: {
    handler: async function (request, h) {
      try {
        const {id} = request.payload;
        const loggedInUserID = request.auth.credentials.id;
        const loggedInUser = await User.findById(loggedInUserID).lean();
        const hive = await Hive.findById(id).lean();
        if ((hive.owner.toString() == loggedInUserID) || loggedInUser.admin) {

          return h.view("updateHiveLocation", { title: "Update Hive Location", hive: hive });
        } else {
          return h.redirect("/maps", { errors: [{ message: 'Only Hive owner or Admin can edit Hive Location' }] });
        }
      } catch (err) {
        return h.redirect("/maps", { errors: [{ message: err.message }] });
      }
    },
  },
  updateLocation: {
    validate: {
      payload: {
        latitude: Joi.number().required(),
        longtitude: Joi.number().required().negative(),
        id: Joi.any()
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        const {id} = request.payload;
        return h
          .view("updateHiveLocation", {
            errors: error.details,
            id: id
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      try {
        const {id} = request.payload;
        const {longtitude} = request.payload;
        const {latitude} = request.payload;

        const update = { longtitude: longtitude,latitude: latitude};
        const hive = await Hive.findByIdAndUpdate(id,update,{ new: true }).lean();

        return h.redirect("/maps");
      } catch (err) {
        return h.redirect("/maps", { errors: [{ message: err.message }] });
      }
    },
  },

  gallery: {
    handler: async function (request, h) {
      try {
        const id = request.params.id.toString();
        const allImages = await Cloudinary.getAllImages(id);
        return h.view("gallery", {
          title: "Hive Gallery",
          images: allImages,
          hive_id: id,
        });
      } catch (err) {
        console.log(err);
      }
    },
  },

  deleteImage: {
    handler: async function (request, h) {
      try {
        const id = request.params.folder;
        const image = request.params.id;
        const imgID = id + "/" + image;
        await Cloudinary.deleteImage(imgID);
        return h.redirect("/gallery/" + id.toString());
      } catch (err) {
        console.log(err);
      }
    },
  },
};

module.exports = Hives;
