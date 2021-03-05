"use strict";

const Mongoose = require("mongoose");
const Schema = Mongoose.Schema;


const hiveSchema = new Schema({
  added: { type: Date, default: Date.now },
  hiveNumber: Number,
  location: String,
  hiveType: String,
  description: String,
  details: [{comments: String, dateLogged: { type: Date, default: Date.now }}],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  }
});

module.exports = Mongoose.model("Hive", hiveSchema);

