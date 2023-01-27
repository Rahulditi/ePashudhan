const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const ejs = require('ejs')
const port = process.env.port || 2000
const login = require('./routes/login');
const register = require('./routes/register')
const dashboard = require('./routes/dashboard');
const admin = require('./routes/admin');
const client = require('./routes/client');

require('dotenv').config();

url = `mongodb+srv://e-pashudhan:1234567890@cluster0.b7zvvpp.mongodb.net/?retryWrites=true&w=majority`
mongoose.set('strictQuery', true);
mongoose.connect(url).then(() => {
    console.log('connected to database');
}).catch((err) => {
    console.log(err);
})

app.use(express.static('public'))
app.use('/css',express.static(__dirname + 'public/css'))
app.use('/js',express.static(__dirname + 'public/js'))
app.use('/img',express.static(__dirname + 'public/img'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())



app.set('view engine','ejs');
// app.set('./views','views');
app.set('views', [__dirname + '/views/farmer',__dirname + '/views/client', __dirname + '/views/admin','views']);


app.get('/',(req,res)=>{
    console.log(process.env.port);
    res.render('index')
})



app.use('/register',register)
app.use('/admin',admin)
app.use('/client',client)
app.use('/login',login);
app.use('/users',dashboard);

app.listen(port,()=>{
    console.log('Listening on port');
})