const mongoose = require("mongoose");

var schema = new mongoose.Schema({
    id:String,
    milk:[{date:String,received:Number,sent:Number,today:Number,net:Number}]
})

module.exports=mongoose.model('livemilk',schema)