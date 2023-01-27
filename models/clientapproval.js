const mongoose = require("mongoose");

var schema = new mongoose.Schema({
    id:String,
    milkstock:[{date:String,email:String,uid:String,milkamt:Number,paid:Number,status:String,time:String}]
})

module.exports=mongoose.model('clientapproval',schema)