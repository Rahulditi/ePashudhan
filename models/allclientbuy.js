const mongoose = require("mongoose");

var schema = new mongoose.Schema({
    id:String,
    data:[{date:String,time:String,email:String,uid:String,milkamt:Number,paid:Number}]
})

module.exports=mongoose.model('buydataforadmin',schema)