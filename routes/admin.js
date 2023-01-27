const express = require('express')
const router = express.Router();
const date = require('date-and-time');
const setprice = require('../models/setprice');
const farmerapprovals = require('../models/farmerapprovals');
var clientbuys = require('../models/clientbuy');
var clientapproval = require('../models/clientapproval');
const selldata = require('../models/sellform');
var allfarmerselldata = require('../models/allfarmerselldata');
var balance = require('../models/adminbalance');
var milk = require('../models/milkstock');
const jwt = require('jsonwebtoken');
var clientbuydata = require('../models/allclientbuy');
const { find } = require('../models/setprice');


const now = new Date();
var current_date = date.format(now, 'MMM DD YYYY');
// var yesterday = date.format(now, -1,'MMM DD YYYY');

// var current_date = 'Jan 26 2023';
var pattern = date.compile('MMM DD YYYY');
var yesterday = date.addDays(now, -1,);
yesterday = date.format(yesterday, pattern)




var current_time = date.format(now, 'HH:mm:ss');

router.get('/login', (req, res) => {
    console.log(yesterday);
    res.render('adminlogin')
})

var token = undefined;

const auth = (req, res, next) => {
    if (token !== undefined) {
        jwt.verify(token, process.env.ACCESS_TOKEN, (err) => {
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
        return res.redirect('/admin/login')
    }
}


router.post('/login', (req, res) => {
    var info = {
        username: req.body.name,
        password: req.body.password
    }
    if (info.username == process.env.name && info.password == process.env.password) {
        token = jwt.sign({ "name": "admin" }, process.env.ACCESS_TOKEN);
        res.redirect('dashboard')
    }
    else {
        res.send("error")
    }
})

router.get("/logout", (req, res) => {
    token = undefined;
    res.redirect('login')
})


router.get('/dashboard', auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: current_date });
    var selldata = await allfarmerselldata.findOne({ id: "admin" });
    var buydata = await clientbuydata.findOne({id:"admin"});
    var approvals = await farmerapprovals.findOne({ id: "admin" })
    var balancesheet = await balance.findOne({id:"admin"},{balance:{$elemMatch:{date:current_date}}})
    var milksheet = await milk.findOne({id:"admin"},{milk:{$elemMatch:{date:current_date}}})

    try{
        res.render('admindashboard',{price:todayprice.price,selldata,time:todayprice.time,date:todayprice.data,netmilk:milksheet.milk[0].net,receivedmilk:milksheet.milk[0].received,sentmilk:milksheet.milk[0].sent,todaymilk:milksheet.milk[0].today,netbal:balancesheet.balance[0].net,sentbal:balancesheet.balance[0].paid,receivedbal:balancesheet.balance[0].received,todaybal:balancesheet.balance[0].today,buydata})
    }
    catch{
        var dummyprice=0;
        res.render('admindashboard',{price:dummyprice,selldata,buydata})
    }

})
router.get('/farmerapprovals', auth, async (req, res) => {
    const farmerdata = await farmerapprovals.findOne({ id: "admin" })
    try {
        res.render('farmerapprovals', { farmerdata: farmerdata });
    }
    catch {
        res.render('farmerapprovals', { orders: "NO PENDING ORDERS" })
    }
})

router.get('/clientorders', auth, async (req, res) => {
    const clientdata = await clientapproval.findOne({ id: "admin" })
    try {
        res.render('clientorders', { clientdata: clientdata });
    }
    catch {
        res.render('farmerapprovals', { orders: "NO PENDING ORDERS" })
    }
})


router.post('/dashboard', auth,async (req, res) => {

    var user = await setprice.findOne({ date: current_date });
    var balancesheet = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: yesterday } } })
    var milkstock = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: yesterday } } })
    var net = 0;
    var milknet = 0;
    console.log(balancesheet.balance[0]);
    console.log();
    if (balancesheet.balance[0] != undefined) {
        net = balancesheet.balance[0].net
    }
    if (milkstock.milk[0] != undefined) {
        milknet = milkstock.milk[0].net
    }
    if (user != null) {
        var rough = await setprice.findOneAndUpdate({ date: current_date }, { $set: { price: req.body.price } })
        var rough1 = await setprice.findOneAndUpdate({ date: current_date }, { $set: { time: current_time } })

    }
    else {
        var info = {
            date: current_date,
            price: req.body.price,
            time: current_time
        };
        var rough = {
            date: current_date,
            received: 0,
            paid: 0,
            today: 0,
            net: net
        }
        var rough1 = {
            date: current_date,
            received: 0,
            sent: 0,
            today: 0,
            net: milknet
        }
        var updatebalance = await balance.findOneAndUpdate({ id: "admin" }, { $push: { balance: rough } })
        var updatemilkstock = await milk.findOneAndUpdate({ id: "admin" }, { $push: { milk: rough1 } })
        var data = new setprice(info);
        data.save();
    }

    const todayprice = await setprice.findOne({ date: current_date });


    res.redirect('/admin/dashboard');
})



router.get('/farmerapprovals/accept/:email/:milkamt/:uid',auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: current_date });
    if(todayprice==null){
        res.send('Today Price is Not Set')
    }
    else{
    var details = await farmerapprovals.updateOne({ id: "admin", data: { $elemMatch: { email: req.params.email, milkamt: req.params.milkamt, uid: req.params.uid } } }, { $set: { 'data.$.status': "verified" } })
    var data = await farmerapprovals.findOne({ id: "admin" }, { data: { $elemMatch: { email: req.params.email, milkamt: req.params.milkamt, uid: req.params.uid } } })
    var delte = await farmerapprovals.findOneAndUpdate({ id: "admin" }, { $pull: { data: { email: req.params.email, milkamt: req.params.milkamt, uid: req.params.uid } } })

    var farmer = await selldata.updateOne({ email: data.data[0].email, Data: { $elemMatch: { milkamt: data.data[0].milkamt, uid: req.params.uid} } }, { $set: { 'Data.$.status': "verified" } })

    var updateearnings = await selldata.updateOne({ email: data.data[0].email, Data: { $elemMatch: { milkamt: data.data[0].milkamt, uid:req.params.uid } } }, { $set: { 'Data.$.earnings': (todayprice.price * req.params.milkamt) } })

    var userearnings = await selldata.findOne({email:req.params.email},{Data:{$elemMatch:{milkamt:req.params.milkamt,uid:req.params.uid}}})

        //updating the balance sheet

        var findbalancesheet = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })
        var temp = Number(userearnings.Data[0].earnings+Number(findbalancesheet.balance[0].paid))
        var updatedbalance = {
            date:findbalancesheet.balance[0].date,
            received:findbalancesheet.balance[0].received,
            paid:String(temp),
            today:String(Number(findbalancesheet.balance[0].received)-temp),
            net:String(Number(findbalancesheet.balance[0].net)+Number(findbalancesheet.balance[0].received)-temp-Number(findbalancesheet.balance[0].today))
        }
        console.log(updatedbalance);

        var pullbalancesheet = await balance.updateOne({ id: "admin" },{$pull:{balance:{date:current_date}}})

        var pushbalancesheet = await balance.updateOne({ id: "admin" },{$push:{balance:updatedbalance}})

        // var updatebalancesheet = await balance.findOneAndReplace({id:"admin",balance:{$elemMatch:{date:current_date}}},{updatedbalance})

        // var updatepaidbalance = await balance.findOneAndReplace({id:"admin",balance:{$elemMatch:{date:current_date}}},{$set:{"received":temp}})
        // console.log((todayprice.price * req.params.milkamt));
    
        // var findtodaybalance = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })
    
        // var updatetodaybalance = await balance.findOneAndUpdate({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { today: Number(findtodaybalance.balance[0].received) - Number(findtodaybalance.balance[0].paid) } })
    
        // var findnetbalance = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })
    
        // var updatenetbalance = await balance.updateOne({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { 'balance.$.net': Number(findnetbalance.balance[0].net) + Number(findnetbalance.balance[0].today)-Number(findbalancesheet.balance[0].today) } })



    
        //
    
        // updating milk stock
        var findmilksheet = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })
    
        var updatesentmilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.received': Number(findmilksheet.milk[0].received) + Number(req.params.milkamt) } })
    
        var findtodaymilk = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })
    
        var updatetodaymilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.today': Number(findtodaymilk.milk[0].received) - Number(findtodaymilk.milk[0].sent) } })
    
        var findnetmilk = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })
    
        var updatenetmilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.net': Number(findnetmilk.milk[0].net) + Number(findnetmilk.milk[0].today)-Number(findmilksheet.milk[0].today) } })



    // var updatebalance = await balance.findOne({ id: "admin", balance: { $elemMatch: { date: current_date } } });
    // if (updatebalance != null) {
    //     var updateamt = Number(todayprice.price * req.params.milkamt) + Number(updatebalance.balance[0].paid)


    //     var updatedetails = await balance.updateOne({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { 'balance.$.paid': updateamt } })


    // }
    // else {
    //     var rough1 = {
    //         date: current_date,
    //         paid: Number(todayprice.price * req.params.milkamt)
    //     }
    //     var updatedb = await balance.findOneAndUpdate({ id: "admin" }, { $push: { balance: rough1 } })

    // }

    var rough = {
        date: current_date,
        email: req.params.email,
        milkamt: req.params.milkamt,
        uid:req.params.uid,
        time: current_time
    }

    var stock = await allfarmerselldata.findOneAndUpdate({ id: 'admin' }, {
        $push: {
            milkstock: rough
        }
    })
}


    res.redirect('/admin/farmerapprovals')
})

router.get('/farmerapprovals/reject/:email/:milkamt/:uid',auth,async(req,res)=>{
    var delte = await farmerapprovals.findOneAndUpdate({id:"admin"},{$pull:{data:{email:req.params.email, milkamt:req.params.milkamt,uid:req.params.uid}}})
    var details = await farmerapprovals.updateOne({ id: "admin", data: { $elemMatch: { email: req.params.email, milkamt: req.params.milkamt, uid: req.params.uid } } }, { $set: { 'data.$.status': "rejected" } })
    res.redirect('/admin/farmerapprovals')
})

router.get('/clientapprovals/accept/:email/:milkamt/:paid/:uid',auth, async (req, res) => {
    var todayprice = await setprice.findOne({ date: current_date });
    if(todayprice==null){
        res.send('Today Price is Not Set')
    }
    else{
    var client = await clientbuys.findOne({ email: req.params.email });
    var updateclient = await clientbuys.updateOne({ email: req.params.email, data: { $elemMatch: { email: req.params.email, milkamt: req.params.milkamt, paid: req.params.paid, uid: req.params.uid } } }, { $set: { 'data.$.status': "verified" } })
    var rough = {
        email: req.params.email,
        time: current_time,
        uid:req.params.uid,
        date: current_date,
        milkamt: req.params.milkamt,
        paid: req.params.paid

    }
    var addtoadmindata = await clientbuydata.findOneAndUpdate({ id: "admin" }, { $push: { data: rough } })
    var deletefromclientapprovals = await clientapproval.findOneAndUpdate({ id: "admin" }, { $pull: { milkstock: { email: req.params.email, uid: req.params.uid, milkamt: req.params.milkamt, paid: req.params.paid } } })


    //updating the balance sheet

    var findbalancesheet = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })
        var temp = Number(Number(req.params.paid)+Number(findbalancesheet.balance[0].received))
        console.log(req.params.paid);
        console.log(Number(findbalancesheet.balance[0].received));
        console.log(temp);
        var updatedbalance = {
            date:findbalancesheet.balance[0].date,
            received:String(temp),
            paid:findbalancesheet.balance[0].paid,
            today:String(Number(temp)-Number(findbalancesheet.balance[0].paid)),
            net:String(Number(findbalancesheet.balance[0].net)-Number(findbalancesheet.balance[0].paid)+temp-Number(findbalancesheet.balance[0].today))
        }
        console.log(updatedbalance);

        var pullbalancesheet = await balance.updateOne({ id: "admin" },{$pull:{balance:{date:current_date}}})

        var pushbalancesheet = await balance.updateOne({ id: "admin" },{$push:{balance:updatedbalance}})


    // var findbalancesheet = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })

    // var updatereceivedbalance = await balance.updateOne({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { 'balance.$.received': Number(findbalancesheet.balance[0].received) + Number(req.params.paid) } })

    // var findtodaybalance = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })

    // var updatetodaybalance = await balance.updateOne({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { 'balance.$.today': Number(findtodaybalance.balance[0].received) - Number(findtodaybalance.balance[0].paid) } })

    // var findnetbalance = await balance.findOne({ id: "admin" }, { balance: { $elemMatch: { date: current_date } } })

    // var updatenetbalance = await balance.updateOne({ id: "admin", balance: { $elemMatch: { date: current_date } } }, { $set: { 'balance.$.net': Number(findnetbalance.balance[0].net) + Number(findnetbalance.balance[0].today)-Number(findbalancesheet.balance[0].today) } })

    //

    // updating milk stock
    var findmilksheet = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })

    var updatesentmilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.sent': Number(findmilksheet.milk[0].sent) + Number(req.params.milkamt) } })

    var findtodaymilk = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })

    var updatetodaymilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.today': Number(findtodaymilk.milk[0].received) - Number(findtodaymilk.milk[0].sent) } })

    var findnetmilk = await milk.findOne({ id: "admin" }, { milk: { $elemMatch: { date: current_date } } })

    var updatenetmilk = await milk.updateOne({ id: "admin", milk: { $elemMatch: { date: current_date } } }, { $set: { 'milk.$.net': Number(findnetmilk.milk[0].net) + Number(findnetmilk.milk[0].today)-Number(findmilksheet.milk[0].today) } })
    //
    }

    res.redirect('/admin/clientorders')

})

router.get('/clientapprovals/reject/:email/:milkamt/:paid/:uid', auth,async (req, res) => {
    var deletefromclientapprovals = await clientapproval.findOneAndUpdate({ id: "admin" }, { $pull: { milkstock: { email: req.params.email, uid: req.params.uid, milkamt: req.params.milkamt, paid: req.params.paid } } })
    res.redirect('/admin/clientorders')
    var updateclient = await clientbuys.updateOne({ email: req.params.email, data: { $elemMatch: { email: req.params.email, milkamt: req.params.milkamt, paid: req.params.paid, uid: req.params.uid } } }, { $set: { 'data.$.status': "rejected" } })
})

module.exports = router;