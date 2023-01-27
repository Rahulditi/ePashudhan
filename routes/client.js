const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
var registerform = require('../models/clientregister');
var clientbuy = require('../models/clientbuy');
const clientregister = require('../models/clientregister');
var clientapprovals = require('../models/clientapproval');
const setprice = require('../models/setprice');
var milkstock = require('../models/milkstock');
const date = require('date-and-time');
const now = new Date();
const jwt = require('jsonwebtoken');
var uniqid = require('uniqid');
var nodemailer = require('nodemailer');
const { route } = require('./admin');
var today_date = date.format(now, 'MMM DD YYYY')
var current_time = date.format(now, 'HH:mm:ss');

console.log(today_date);

var token = undefined;

const auth = (req, res, next) => {
    if (token !== undefined) {
        jwt.verify(token, process.env.CLIENT_TOKEN, (err) => {
            if (err) {
                return res.status(404).send('TOKEN NOT VERIFIED');
            }
            else {
                next();
            }
        })
    }
    else {
        // return res.status(404).send('NEEDS TO LOGIN FIRST');
        return res.redirect('/client/login')
    }
}


router.get('/register', (req, res) => {
    res.render('clientregister')
})

var registerinfo;

var transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'rahulditi01@outlook.com',
        pass: 'Outlook@123'
    }
});
var otp = Math.floor(1000 + Math.random() * 9000);
console.log(
    otp
);

router.post('/register', async (req, res) => {
    if (req.body.password == req.body.confirmpassword) {
        const pass = await bcrypt.hash(req.body.password, 10);
        const user = await registerform.findOne({ email: req.body.email });
        if (user) {
            res.render('clientregister', { text: "user already exists" })
        }
        else {
            registerinfo = {
                companyname: req.body.companyname,
                clientname: req.body.clientname,
                state: req.body.state,
                city: req.body.city,
                locality: req.body.locality,
                companyaddress: req.body.companyaddress,
                pincode: req.body.pincode,
                contactno: req.body.contactno,
                email: req.body.email,
                password: pass,
                confirmpassword: pass
            }
            var mailOptions = {
                from: 'rahulditi01@outlook.com',
                to: registerinfo.email,
                subject: 'Verify Your Account',
                html: `<p>Enter otp <b>${otp}</b> to verify your E-pashudhan account</p>`
            };

            await transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.render('clientotp');

        }
    }
    else {
        res.render('clientregister', { text: "passwords doesnt't match" })
    }
})

router.post('/otp', async (req, res) => {
    if (otp == req.body.otp) {
        var details = new registerform(registerinfo);
        var buy = new clientbuy({ email: registerinfo.email });
        await details.save();
        await buy.save();
        res.send('Success Login To Continue');
    }
    else {
        res.render('otp', { message: "Incorrect OTP" })
    }
})

router.get('/login', (req, res) => {
    res.render('clientlogin')
})
var useremail = {
    Email: undefined
}
router.post('/login', async (req, res) => {
    var info = {
        email: req.body.email,
        password: req.body.password
    }
    const user = await registerform.findOne({ email: info.email });
    if (user) {
        var checkpass = await bcrypt.compare(info.password, user.password);
        if (checkpass) {
            useremail.Email = user.email;
            token = jwt.sign({ "name": "client" }, process.env.CLIENT_TOKEN);
            res.redirect('/client/dashboard')
        }
        else {
            res.render('login', { text: "Incorrect Password" })
        }
    }
    else {
        res.render('login', { text: "No user exists" })
    }
})

router.get('/logout', (req, res) => {
    token = undefined
    res.redirect('/client/login')
})

router.get('/dashboard', auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: today_date });
    var buydata = await clientbuy.findOne({ email: useremail.Email })
    var user = await registerform.findOne({ email: useremail.Email }, { '_id': false });
    var today = 0;
    var month = 0;
    var overall = 0;
    for (var i = 0; i < buydata.data.length; i++) {
        if (buydata.data[i].date == today_date && buydata.data[i].status == "verified") {
            today += buydata.data[i].milkamt
        }
        if (i != 30 && buydata.data[i].status == "verified") {
            month += buydata.data[i].milkamt
        }
        if (buydata.data[i].status == "verified") {
            overall += buydata.data[i].milkamt
        }
    }
    try {
        res.render('clientdashboard', { price: todayprice.price, date: todayprice.date, time: todayprice.time, email: user.email, companyname: user.companyname, companyaddress: user.companyaddress, today: today, month: month, overall: overall, date: today_date, buydata: buydata })
    }
    catch {
        res.render('clientdashboard', { price: 0, email: user.email, companyname: user.companyname, companyaddress: user.companyaddress, today: today, month: month, overall: overall, date: today_date, buydata: buydata })
    }
})

router.get('/buy', auth, (req, res) => {
    res.render('buy')
})





router.post('/buy', auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: today_date });
    var stock = await milkstock.findOne({ id: "admin" }, { milk: { $elemMatch: { date: today_date } } });
    console.log(stock.milk[0].net);
    try {
        rough = {
            email: useremail.Email,
            milkamt: req.body.milkamt,
            paid: (todayprice.price) * req.body.milkamt,
            date: today_date,
            uid: uniqid(),
            time: current_time,
            status: "pending"
        }
        if (stock.milk.length == 0 || stock.milk[0].net == 0 || Number(rough.milkamt) > stock.milk[0].net) {
            res.send("MILK IS OUT OF STOCK")
        }
        else {
            res.redirect('/client/payorcancel')
        }
    }
    catch {
        res.send("ERROR TRY AFTER SOMETIME")

    }
})

router.get('/payorcancel', auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: today_date });
    var price = (rough.milkamt) * todayprice.price;
    res.render("payorcancel", { price: price })
})

router.get('/pay/:amount', auth, async (req, res) => {
    var amount = req.params.amount
    var client = await clientbuy.findOneAndUpdate({ email: useremail.Email }, {
        $push: {
            data: rough
        }
    })
    var approvals = await clientapprovals.findOneAndUpdate({ id: "admin" }, { $push: { milkstock: rough } })
    console.log(useremail.Email);
    res.render('successfull')
})

router.get('/rejectorder', auth, (req, res) => {
    res.redirect('/buy')
})

router.get('/ordershistory', async (req, res) => {
    var buydata = await clientbuy.findOne({ email: useremail.Email })
    try {
        res.render('ordershistory', { buydata: buydata })
    }
    catch {
        res.render('ordershistory', { data: "No Data" })
    }
})

router.get('/clientprofile', async (req, res) => {
    const user = await registerform.findOne({ email: useremail.Email });
    res.render('clientprofile', { clientdata: user })
})

router.post('/changepass', async (req, res) => {
    const user = await registerform.findOne({ email: useremail.Email });
    var rough = {
        oldpassword: req.body.oldpassword,
        newpassword: req.body.newpassword,
        confirmnewpassword: req.body.confirmnewpassword
    }
    var checkpass = await bcrypt.compare(rough.oldpassword, user.password)
    if (checkpass) {
        if (rough.newpassword == rough.confirmnewpassword) {
            var newpass = await bcrypt.hash(rough.newpassword, 10);
            var updatepass = await registerform.findOneAndUpdate({ email: useremail.Email }, { $set: { password: newpass } })
            var updatecpass = await registerform.findOneAndUpdate({ email: useremail.Email }, { $set: { confirmpassword: newpass } })
            res.render('clientprofile', { message: "Success", clientdata: user })
        }
        else {
            res.render('clientprofile', { message: "new passwords not matching", clientdata: user })
        }
    }
    else {
        res.render('clientprofile', { message: "Incorrect Old Password", clientdata: user })
    }

})

module.exports = router;