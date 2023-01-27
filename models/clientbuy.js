var mongoose = require('mongoose');

var clientbuy = mongoose.Schema({
    email:String,
    data:[{milkamt:Number,paid:Number,uid:String,date:String,time:String,status:String}]
})

module.exports=mongoose.model('clientbuy',clientbuy);