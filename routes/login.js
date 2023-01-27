const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
var form = require('../models/register_form');
var sellform=require('../models/sellform');
const bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
require('dotenv').config();


router.get('', (req, res) => {
    res.render('login');
})


router.post('', async (req, res) => {
    var info = {
        email: req.body.email,
        password: req.body.password
    }
    // emailinput.email = info.email;
    process.env.farmer_email=info.email
    const user = await form.findOne({ email: info.email }, { '_id': false });
      if (user!=null) {
        const result = await bcrypt.compare(info.password, user.password);
        if(result){
        process.env.token_key = jwt.sign({ "name": "rahul" }, process.env.farmer_token);
         res.redirect('/users/dashboard')
        }
        else{
            res.render('login',{text:"Incorrect-Password"})
        }
    
    }
    else {
        res.render('login',{text:"Incorrect-Email"})
    }
})


module.exports=router;

