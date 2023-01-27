const mongoose = require('mongoose');

const form = new mongoose.Schema({
    data:[{
    email:String,
    milkamt:Number,
    date:String,
    uid:String,
    time:String,
    status:String
    }
    ]
})

module.exports=mongoose.model('farmerapprovals',form);