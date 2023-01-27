const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
var form = require('../models/register_form');
var sellform = require('../models/sellform');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: 'rahulditi01@outlook.com',
    pass: 'Outlook@123'
  }
});
var otp = Math.floor(1000 + Math.random() * 9000);
console.log(
  otp
);


router.get('', (req, res) => {
  res.render('register')
});
var info = {};

router.post('', async (req, res) => {
  if (req.body.password == req.body.confirmpassword) {
    const pass = await bcrypt.hash(req.body.password, 10);
    const user = await form.findOne({ email: req.body.email });
    if (user) {
      res.render('register',{message:"user with email already exists"})
    }
    else {
      info = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        state: req.body.state,
        city: req.body.city,
        locality: req.body.locality,
        houseno: req.body.houseno,
        pincode: req.body.pincode,
        contactno: req.body.contactno,
        email: req.body.email,
        password: pass,
        confirmpassword: pass
      }
      var mailOptions = {
        from: 'rahulditi01@outlook.com',
        to: info.email,
        subject: 'Verify Your Account',
        html: `<p>Enter otp <b>${otp}</b> to verify your E-pashudhan account</p>`
      };

      await transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      res.render('otp');
      console.log(info.email);
    }
  }
  else {
    res.render('register',{message:"Passwords Doesnt Match"})
  }
})

router.post('/otp', async (req, res) => {
  if (otp == req.body.otp) {
    const sellformemail = new sellform({ email: info.email});
    await sellformemail.save();
    const data = new form(info);
    await data.save();
    res.send('Success Login to Continue')
  }
  else{
    res.render('otp',{message:"Incorrect OTP"})
  }
})



module.exports = router;