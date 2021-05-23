"use strict";
const User = require("../models/user");
const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const Analytics = require("../utils/analytics");
const { report } = require("../utils/analytics");
const nodemailer = require("../utils/nodemailer.config");
const auth = require("../utils/auth.config");
const jwt = require("jsonwebtoken");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const characters = "3PDQU5T2elyDBwtYlbc7kiRx5o2sLQyw";



//
var gtoggle = ""
const Accounts = {
  index: {
    auth: false,
    handler: function (request, h) {
      return h.view("main", { title: "Welcome to hives" });
    },
  },
  
  showSignup: {
    auth: false,
    handler: function (request, h) {
      return h.view("signup", { title: "Sign up for hives" });
    },
  },
  signup: {
    auth: false,
    validate: {
      payload: {
        firstName: Joi.string().required().regex(/^[A-Z][a-z-a*]{2,}$/),
        lastName: Joi.string().required().regex(/^[A-Z][A-Za-z\s\'\-]{2,}$/),
        email: Joi.string().email().required(),
        password: Joi.string().required().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
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
        const test = payload.email;
        let user = await User.findByEmail(payload.email);
        if (user) {
          const message = "Email address is already registered";
          throw Boom.badData(message);
        };
        let token = "";
        for (let i = 0; i < characters.length; i++) {
          token += characters[Math.floor(Math.random() * characters.length)];
        };
        const hash = await bcrypt.hash(payload.password, saltRounds);
        token = jwt.sign({ email: payload.email }, auth.secret);
        const newUser = new User({
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          password: hash,
          confirmationCode: token,
        });

        const res = nodemailer.sendConfirmationEmail(newUser.firstName, newUser.email, token);

        user = await newUser.save();
        
        if (user.status != "Active") {
          const message= "Pending Account. Please Verify Your Email!";
          throw Boom.unauthorized(message);
        };
        //return h.redirect("/home");
        return user;
      } catch (err) {
        //return h.view("login", { errors: [{ message: err.message }], toggle: gtoggle });
        return err;
      }
      
    },
  },
  showLogin: {
    auth: false,
    handler: function (request, h) {
      return h.view("login", { title: "Login to hives", toggle: false });
    },
  },
  login: {
    auth: false,
    validate: {
      payload: {
        email: Joi.string().email().required(),
        password: Joi.string().required().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
      },
      options: {
        abortEarly: false,
      },
      failAction: function (request, h, error) {
        return h
          .view("login", {
            title: "Sign in error",
            errors: error.details,
            toggle: false
          })
          .takeover()
          .code(400);
      },
    },
    handler: async function (request, h) {
      const { email, password, google } = request.payload;
      try {
        let user1 = await User.findByEmail(email).lean();
        let user = await User.findByEmail(email);
        if (!user) {
          const message = "Email address is not registered";
          throw Boom.unauthorized(message);
        };
        
        //user1 = await User.findById(user._id).lean();
        user.comparePassword(password);
        if (user1.status != "Active") {
          const message= "Pending Account. Please Verify Your Email!";
          throw Boom.unauthorized(message);
        };
        
        request.cookieAuth.set({ id: user.id });
        return h.redirect("/home");
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] , toggle: false});
      }
    },
  },
  googleLogin: {
    auth: false,
    
    handler: async function (request, h) {
      const { googleemail, googlefirstName, googlelastName } = request.payload;
      try {
        let user1 = await User.findByEmail(googleemail).lean();
        let user = await User.findByEmail(googleemail);
        if (!user) {
          const message = "Email address is not registered";
          gtoggle = true;
          throw Boom.unauthorized(message);
        };
        
        //user1 = await User.findById(user._id).lean();
        if (user1.status != "Active") {
          await User.findOneAndUpdate({ email: googleemail }, { status: "Active" , confirmationCode: "" });
        };
        
        
        request.cookieAuth.set({ id: user.id });
        gtoggle = true;
        return h.redirect("/home");
      } catch (err) {
        return h.view("signup", { errors: [{ message: err.message }], email: googleemail, firstName: googlefirstName, lastName: googlelastName });
      }
    },
  },
  logout: {
    handler: function (request, h) {
      request.cookieAuth.clear();
      return h.redirect("/");
    },
  },
  showSettings: {
    handler: async function (request, h) {
      try {
        const id = request.auth.credentials.id;
        const user = await User.findById(id).lean();
        const allUsers = await User.find({}).lean();
        const report = await Analytics.report();
        if (!user.admin) {
          return h.view("settings", { title: "Account Settings", user: user });
        } else {
          return h.view("admin-settings", {
            title: "Account Admin Settings",
            user: user,
            allUsers: allUsers,
            report: report,
          });
        }
      } catch (err) {
        return h.view("login", { errors: [{ message: err.message }] , toggle: false });
      }
    },
  },
  updateSettings: {
    validate: {
      payload: {
        firstName: Joi.string().required().regex(/^[A-Z][a-z-a*]{2,}$/),
        lastName: Joi.string().required().regex(/^[A-Z][A-Za-z\s\'\-]{2,}$/),
        email: Joi.string().email().required(),
        password: Joi.string().required().regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/),
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
        const hash = await bcrypt.hash(userEdit.password, saltRounds);
        user.password = hash;
        await user.save();
        return h.redirect("/settings");
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
      }
    },
  },
  updateStatus: {
    handler: async function (request, h) {
      try {
        const str = request.path;
        var result = "";
        var count = 0;
        for (var i = 0; i < str.length; i++) {
          if (str.charAt(i) == "/") {
            count = count + 1;
          }
          if (count >= 2 && str.charAt(i) != "/") {
            result = result + str.charAt(i);
          }
        }
        await User.findOneAndUpdate({ confirmationCode: result }, { status: "Active" , confirmationCode: "" });
        return h.redirect("/login");
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
        const report = await Analytics.report();
        return h.view("admin-settings", {
          title: "Account Admin Settings",
          user: user,
          allUsers: allUsers,
          report: report,
        });
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
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

        if (member.admin) {
          member.admin = false;
        } else member.admin = true;
        const filter = { _id: _id };
        const update = { admin: member.admin };
        let adminRights = await User.findOneAndUpdate(filter, update, { new: true });
        console.log("Member " + member.email + " Has admin rights updated");
        const allUsers = await User.find({}).lean();
        const report = await Analytics.report();
        return h.view("admin-settings", {
          title: "Account Admin Settings",
          user: user,
          allUsers: allUsers,
          report: report,
        });
      } catch (err) {
        return h.view("main", { errors: [{ message: err.message }] });
      }
    },
  },
};

module.exports = Accounts;
