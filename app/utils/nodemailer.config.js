'use strict';

const { string } = require("@hapi/joi");
const nodemailer = require("nodemailer");
//const config = require("./auth.config");

const user = process.env.user;
const pass = process.env.pass;


const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: user,
    pass: pass,
  },
});

module.exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    console.log("Check");
    transport.sendMail({
      from: user,
      to: email,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
          <h2>Hello ${name}</h2>
          <p>Thank you for subscribing to Hive Tracker. Please confirm your email by clicking on the following link</p>
          <a href="http://localhost:3000/confirm/${confirmationCode}"> Click here</a>
          </div>`,
    }).catch(err => console.log(err));
  };