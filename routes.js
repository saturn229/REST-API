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
        username: user.emailAddress,
        Id: user.id
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
router.get('/courses', asyncHandler(async (req, res) => {
    try {
        var courseList = [];
        var courseDetail = {};



        let courses = await Course.findAll();

        await Promise.all(courses.map(async (course, index) => {
            let user = await User.findOne({where: {id: course.userId}})
                courseDetail = {
                    title: course.title,
                    description: course.description,
                    materialsNeeded: course.materialsNeeded,
                    estimatedTime: course.estimatedTime,
                    id: course.id,
                    user: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: user.emailAddress,
                        id: user.id
                    }
                }
                courseList[index] = courseDetail;

                
            }))

            res.status(200);
            res.json(courseList);


    } catch(error){
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400)
            res.json({ errors });;
        } else {
            throw error;
        }
    }
    res.end();
    
}));


// return a specific course
router.get('/courses/:id', asyncHandler(async(req, res) => {
    let courseDetail = null;

    try {
        await Course.findOne({
            where: {
                id: req.params.id
            }
        }).then(async course => {
            if(course !== null && typeof(course) !== 'undefined'){
                await User.findOne({where: {id: course.userId}}).then((user) => {
                    
                    courseDetail = {
                        title: course.title,
                        description: course.description,
                        materialsNeeded: course.materialsNeeded,
                        estimatedTime: course.estimatedTime,
                        id: course.id,
                        userId: course.userId,
                        user: {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                emailAddress: user.emailAddress,
                                Id: user.id
                            }
                    }

                    res.status(200);
                    res.json(courseDetail);
                }).catch((error) => {
                    res.status(500);
                    res.json({"message": `Could not find associated user for course ${course.title}`});
                })
            } else {
                res.status(404)
                res.json({"message": "record not found"})

            }
        });
    } catch(error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400)
            res.json({ errors });
            res.end();
        } else {
            throw error;
        }
    } 
    res.end();
    
}));


// create new coures
// update a course
// delete a course

// create validation 

// hash password

// add user authentication

module.exports = router