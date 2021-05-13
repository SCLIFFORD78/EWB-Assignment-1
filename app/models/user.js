"use strict";

const Mongoose = require("mongoose");
var autoIncrement = require('mongoose-auto-increment');
const Boom = require("@hapi/boom");
const Schema = Mongoose.Schema;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  admin: { type: Boolean, default: false }
});

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email : email});
};

userSchema.methods.comparePassword = function(candidatePassword) {
  const isMatch = this.password === candidatePassword;
  if (!isMatch) {
    throw Boom.unauthorized('Password mismatch');
  }
  return this;
};

//userSchema.plugin(autoIncrement.plugin, {model: 'User', field:'memberNumber'});

module.exports = Mongoose.model("User", userSchema);
