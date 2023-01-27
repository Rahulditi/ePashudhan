const mongoose = require("mongoose");

var schema = new mongoose.Schema({
    id:String,
    milkstock:[{date:String,email:String,milkamt:Number}]
})

module.exports=mongoose.model('selldataforadmin',schema)