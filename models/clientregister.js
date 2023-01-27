var mongoose = require('mongoose');

var register =  mongoose.Schema({
    companyname:String,
    clientname:String,
    state:String,
    city:String,
    locality:String,
    companyaddress:String,
    pincode:Number,
    contactno:Number,
    email:String,
    password:String,
    confirmpassword:String

})

module.exports=mongoose.model('clientregistrations',register);