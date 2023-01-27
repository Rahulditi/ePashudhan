const mongoose = require('mongoose');
const farmerbio = require('./register_form');
const form = new mongoose.Schema({
    email:String,
    Data:[{milkamt:Number,earnings:Number,uid:String,date:String,time:String,status:String}]
})

module.exports=mongoose.model('farmerselldata',form);