"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Joi = require('@hapi/joi');
const Analytics = require("../utils/analytics");
const { report } = require("../utils/analytics");

const Accounts = {
  index: {
    auth: false,
    handler: function(request, h) {
      return h.view("main", { title: "Welcome to hives" });
    }
  },
  showSignup: {
    auth: false,
    handler: function(request, h) {
      return h.view("signup", { title: "Sign up for hives" });
    }
  },
  signup: {
    auth: false,
    validate: {
      payload: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("signup", {
            title: "Sign up error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      try {
        const payload = request.payload;
        let user = await User.findByEmail(payload.email);
        if (user) {
          const message = "Email address is already registered";
          throw Boom.badData(message);
        }
        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: payload.password,
        });
        user = await newUser.save();
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("signup", { errors: [{ message: err.message }] });
      }
    },
  },
  showLogin: {
    auth: false,
    handler: function(request, h) {
      return h.view("login", { title: "Login to hives" });
    }
  },
  login: {
    auth: false,
    validate: {
      payload: {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("login", {
            title: "Sign in error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const { email, password } = request.payload;
      try {
        let user = await User.findByEmail(email);
        if (!user) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
        }
        user.comparePassword(password);
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
    },
  },
  logout: {
    handler: function(request, h) {
      request.cookieAuth.clear();
      return h.redirect("/");
    }
  },
  showSettings: {
    handler: async function(request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        const allUsers = await User.find({}).lean();
        const report =  await Analytics.report();
        if(!user.admin){
          return h.view("settings", { title: "Account Settings", user: user });}
        else {
          return h.view("admin-settings", { title: "Account Admin Settings", user: user , allUsers: allUsers,report: report});}
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] });
      }
    }
  },
  updateSettings: {
    validate: {
      payload: {
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("settings", {
            title: "Sign up error",
            errors: error.details,
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      try {
        const userEdit = request.payload;
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        user.firstName = userEdit.firstName;
        user.lastName = userEdit.lastName;
        user.email = userEdit.email;
        user.password = userEdit.password;
        await user.save();
        return h.redirect("/settings");
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
      }
    },
  },
  deleteAccount: {
    handler: async function (request, h) {
      try {
        const userEdit = request.payload;
        const id = request.auth.credentials.id;
        const user = await User.findById(id);
        console.log("This Account will get deleted " + user.email);
        user.remove();
        

        return h.view("main");
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
      }
    },
  },
  adminDeleteAccount: {
    handler: async function (request, h) {
      try {
        const { id } = request.payload;
        const adminId = request.auth.credentials.id;
        const user = await User.findById(adminId).lean();
        const member = await User.findById(id);
        console.log("This Account will get deleted " + member.email);
        member.remove();
        const allUsers = await User.find({}).lean();
        const report =  await Analytics.report();
        return h.view("admin-settings", { title: "Account Admin Settings", user: user , allUsers: allUsers,report: report});
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }]});
      }
    },
  },
  toggleAdmin: {
    handler: async function (request, h) {
      try {
        const { _id } = request.payload;
        const adminId = request.auth.credentials.id;
        const user = await User.findById(adminId).lean();
        const member = await User.findById(_id).lean();
        
        if (member.admin){
          member.admin = false;
        }
        else
          member.admin = true;
        const filter = {'_id':_id };
        const update = {'admin': member.admin};
        let adminRights = await User.findOneAndUpdate(filter,update,{new: true});
        console.log("Member " + member.email + " Has admin rights updated");
        const allUsers = await User.find({}).lean();
        const report =  await Analytics.report();
        return h.view("admin-settings", { title: "Account Admin Settings", user: user , allUsers: allUsers, report: report});
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }]});
      }
    },
  },

};

module.exports = Accounts;
