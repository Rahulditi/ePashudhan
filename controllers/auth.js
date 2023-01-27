const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const auth = (req, res, next) => {
    console.log(process.env.farmer_token);
    if (process.env.token_key !== undefined) {
        jwt.verify(process.env.token_key,process.env.farmer_token, (err) => {
            if (err) {
                return res.redirect('/login')
            }
            else {
                next();
            }
        })
    }
    else {
        // return res.status(404).send('NEEDS TO LOGIN FIRST');
        return res.redirect('/login')
    }
}

module.exports={auth};