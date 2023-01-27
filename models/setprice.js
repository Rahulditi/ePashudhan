const mongoose = require('mongoose')

const price = mongoose.Schema({
    date:String,
    time:String,
    price:Number
})

module.exports=mongoose.model('price',price);