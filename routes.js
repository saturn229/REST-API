'use strict';


const express = require('express');
const { asyncHandler } = require('./middleware/async-handler');
const { User, Course } = require('./models');
const { authenticateUser } = require('./middleware/auth-user');
const bcrypt = require('bcrypt');

const router = express.Router();

//return a list of users
router.get('/users', asyncHandler(async(req, res) => {
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

        const createdUser = await User.create(newUser);
        
        // Set response status and header after creating user
        await User.create(newUser).then(createdUser => {
                res.status(201)
                res.header('location', '/');
            });
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            console.error('Unexpected error:', error);
            res.status(400).json({ errors });   
        } else {
            console.error('Unexpected error:', error);
            throw error;
        }
    }
}));


//return a list of courses

module.exports = router