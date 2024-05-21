'use strict';


const express = require('express');
const { asyncHandler } = require('./middleware/async-handler');
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');
const bcrypt = require('bcrypt');

const router = express.Router();

//return a list of users
router.get('/users', authenticateUser, asyncHandler(async(req, res) => {
    const user = req.currentUser;

    res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.email,
        password: user.password
    });
    res.status(200);
    res.end();
}));


router.post('/users', asyncHandler(async (req, res) => {
    try {
        let newUser = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            emailAddress: req.body.emailAddress,
            password: req.body.password
        };

        // Set response status and header after creating user
        await User.create(newUser).then(createdUser => {
                res.status(201)
                res.header('location', '/');
            });
    } catch (error) {
        const errors = error.errors.map(err => err.message);
        res.status(400).json({ errors });   
        
    }
}));


// return a list of all courses
// return a specific course
// create new coures
// update a course
// delete a course

// create validation 

// hash password

// add user authentication

module.exports = router