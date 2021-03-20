"use strict";
const Hive = require("../models/hive");
const User = require("../models/user");
const Cloudinary = require("../utils/cloudinary");
const { Exception } = require("handlebars");

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
          hives = await Hive.find().populate("owner").lean();
          filter = "ALL Catagories displayed. Select hive type to filter";
        } else if (response["National"] == "on") {
          hives = await Hive.find({ hiveType: "National" }).populate("owner").lean();
          filter = "NATIONAL HIVES displayed. Select hive type to filter";
        } else if (response["Super"] == "on") {
          hives = await Hive.find({ hiveType: "Super" }).populate("owner").lean();
          filter = "SUPER HIVES displayed. Select hive type to filter";
        } else {
          hives = await Hive.find().populate("owner").lean();
          filter = "ALL Catagories displayed. Select hive type to filter";
        }
      else {
        hives = await Hive.find().populate("owner").lean();
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
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        const data = request.payload;
        var hiveType = "Super";
        if (data.radio2 == "on") hiveType = "National";
        const newHive = new Hive({
          latitude: data.latitude,
          longtitude: data.longtitude,
          hiveType: hiveType,
          description: data.description,
          owner: user._id,
          details: { comments: data.details },
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
        hive.details.push({ comments: data.details });
        await hive.save();
        const hiveUpdates = await Hive.findById(id).lean();
        return h.view("hive-detail", { title: "Hive Detailed Records", hive: hiveUpdates });
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }] });
      }
    },
  },
  deleteComment: {
    handler: async function (request, h) {
      const { _id } = request.payload;
      var hive1 = '';
      try {
        const loggedInUserID = request.auth.credentials.id;
        const loggedInUser = await User.findById(loggedInUserID).lean();
        const hive = await Hive.find({ "details._id": _id }).lean();
        const hiveID = hive[0]["_id"].toString();
        hive1 = await Hive.findById(hiveID).lean();
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
          return h.view("hive-detail", { title: "Hive Detailed Records", hive: hive2 });
        } else {
          return h.view("hive-detail", {
            title: "Hive Detailed Records",
            errors: [{ message: "No Authority to delete. Must be owner or admin!" }],
            hive: hive1,
          });
        }
      } catch (err) {
        return h.view("hive-detail", { errors: [{ message: err.message }], hive: hive1 });
      }
    },
  },

  deleteHive: {
    handler: async function (request, h) {
      const loggedInUserID = request.auth.credentials.id;
      const loggedInUser = await User.findById(loggedInUserID).lean();
      const { deleteHive } = request.payload;
      const hive = await Hive.findById(deleteHive);
      const test1 = hive.owner.toString();
      if (hive.owner.toString() == loggedInUserID || loggedInUser.admin) {
        try {
          await Cloudinary.deleteUploadPreset(test);
        } catch (error) {
          console.log(error);
        }
        try {
          await Cloudinary.deleteResourcesByPrefix(test);
        } catch (error) {
          console.log(error);
        }
        try {
          await Cloudinary.deleteFolder(test);
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
