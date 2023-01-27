const mongoose = require("mongoose");

var schema = new mongoose.Schema({
    id:String,
    balance:[{date:String,received:String,paid:String,today:String,net:String}]
})

module.exports=mongoose.model('adminbalance',schema)