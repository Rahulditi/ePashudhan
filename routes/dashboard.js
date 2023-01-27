const express = require('express');
const router = express.Router();
var { auth } = require('../controllers/auth');
var form = require('../models/register_form');
const date = require('date-and-time');
var sellform = require('../models/sellform');
const setprice = require('../models/setprice');
const farmerapprovals = require('../models/farmerapprovals');
const now = new Date();
var today_date = date.format(now, 'MMM DD YYYY')
var current_time=date.format(now, 'HH:mm:ss'); 
var bcrypt = require('bcrypt');
var uniqid = require('uniqid');
require('dotenv').config();

const SendmailTransport = require('nodemailer/lib/sendmail-transport');

console.log(uniqid());
router.get('/dashboard', auth, async (req, res) => {
    var selldata = await sellform.findOne({ email: process.env.farmer_email })
    var user = await form.findOne({ email: process.env.farmer_email }, { '_id': false });
    var todayprice = await setprice.findOne({ date: today_date });
    var counter=0;
    var current_date="";
    var milk=[]
    var labels=[]
    earnings=[]
    for (var i = 0; i < selldata.Data.length; i++) {
        var amt = 0;
        if (current_date==""){
            current_date=selldata.Data[i].date;
            if(current_date!="0"){
            labels.push(current_date)
            }
        }
         if (selldata.Data[i].date==current_date && selldata.Data[i].status=="verified" && i!=0){
            amt=milk[counter-1]+selldata.Data[i].milkamt;
            ear=earnings[counter-1]+selldata.Data[i].earnings;
            milk.pop(counter-1);
            milk.push(amt);
            earnings.pop(counter-1);
            earnings.push(ear);
            current_date=selldata.Data[i].date;
        }
        else if(selldata.Data[i].status=="verified" && selldata.Data[i].date!="0"){
            milk.push(selldata.Data[i].milkamt);
            earnings.push(selldata.Data[i].earnings);
            current_date=selldata.Data[i].date;
            labels.push(current_date)
            counter++;
        }

        
    }
    console.log(today_date);
    console.log(todayprice);
    var today=0;
    var overall=0;
    var price=0;
    if(todayprice!=null){
        price=todayprice.price;
        var today= Math.ceil(earnings[earnings.length-1]);
        for (let i = 0; i < earnings.length; i++) {
        overall+= Math.ceil(earnings[i])
        
    }
    }
    console.log(milk);
    console.log(labels);
    try{
    res.render('dashboard', { name: user.firstname, phno: user.contactno, email: user.email, today: today, thirtydays: overall, overall: overall, milk,labels, price:price,date:todayprice.date,time:todayprice.time });
    }
    catch{
        res.render('dashboard',{name: user.firstname, phno: user.contactno, email: user.email, today: today, thirtydays: overall, overall: overall, milk,labels, price:price})
    }
})

router.post('/logout', auth, (req, res) => {
    process.env.token_key=undefined
    res.redirect('/login')
})

router.get('/sell', auth, async (req, res) => {
    var selldata = await sellform.findOne({ email: process.env.farmer_email });
    res.render('sell', { selldata: selldata });
})



router.post('/sell', async (req, res) => {
    var user = await sellform.find({ email: process.env.farmer_email });
    // console.log(user[0].Data);
    // if(user[0].Data[user[0].Data.length-1].date==current_date){
    //     var amt = user[0].Data[user[0].Data.length-1].milkamt+Number(req.body.milkamt)
    var rough = {
        email: process.env.farmer_email,
        milkamt: req.body.milkamt,
        date: today_date,
        uid:uniqid(),
        time:current_time,
        earnings:0,
        status: "pending"
    }
    //     console.log(rough);
    //     await sellform.updateOne({email:process.env.farmer_email,'Data.date':current_date},{$set:{'Data.$.milkamt':amt}})
    //     res.send('success');
    //   }

    //   else{
    //     console.log(user[0].Data);
    //     var rough={
    //         milkamt:req.body.milkamt,
    //         date:current_date,
    //         status:"pending"
    //     }
    //     await sellform.findOneAndUpdate({
    //         email:process.env.farmer_email
    //     },{
    //         $push:{
    //             Data:rough
    //         }
    //     });
    //     res.send('success')
    //   }
    // var rough={
    //     milkamt:req.body.milkamt,
    //     date:"Jan 04 2023",
    //     status:"pending"
    // }
    await sellform.findOneAndUpdate({
        email:process.env.farmer_email
    },{
        $push:{
            Data:rough
        }
    });

    await farmerapprovals.findOneAndUpdate({
        id: "admin"
    }, {
        $push: {
            data: rough
        }
    });
    res.redirect('/users/sell')

})

router.get('/profile', auth,async (req, res) => {
    var user = await form.findOne({ email: process.env.farmer_email });
    console.log(user.firstname);
    res.render('profile', {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: process.env.farmer_email,
        phno: 6309770703,
        city: user.city,
        state: user.state,
        zip: 500013
    });
})

router.post("/profile",async(req,res)=>{
    var passfind = await form.findOne({email:process.env.farmer_email});
    var info={
        oldpass:req.body.oldpass,
        newpass:req.body.newpass,
        confirmnewpass:req.body.confirmnewpass
    }
    var check = await bcrypt.compare(info.oldpass,passfind.password);
    console.log(check);
    if(info.newpass==info.confirmnewpass && check){
        var newpass = await bcrypt.hash(info.newpass,10);
        await form.updateMany({email:process.env.farmer_email},{$set:{'password':newpass,'cpassword':newpass}})
        res.send("Success");
    }
    else{
        res.send("wrong old pass")
    }
})

module.exports = router;