const express = require('express');
const mongoose = require('mongoose');

const details = mongoose.Schema({
    firstname: String,
    lastname: String,
    state:String,
    city:String,
    locality:String,
    houseno:String,
    pincode:Number,
    contactno:Number,
    email:String,
    password:String,
    confirmpassword:String
});

module.exports = mongoose.model('farmerdata', details);