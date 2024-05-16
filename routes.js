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
            firstName: req.firstName,
            lastName: req.lastName,
            emailAddress: req.emailAddress,
            password: req.password
        };

        const createdUser = await User.create(newUser);
        
        // Set response status and header after creating user
        res.status(201).header('Location', '/');
        res.json(createdUser);
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400).json({ errors });   
        } else {
            throw error;
        }
    }
}));


//return a list of courses

module.exports = router