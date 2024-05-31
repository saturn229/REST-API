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


router.post('/users',  asyncHandler(async (req, res) => {
    try {
        if (typeof(req.body.password) !== 'undefined') {
            let password = req.body.password;
            const hashedPassword = bcrypt.hashSync(password, 10);
            let newUser = {
                "firstName": req.body.firstName,
                "lastName": req.body.lastName,
                "emailAddress": req.body.emailAddress,
                "password": hashedPassword
            };
        

        // Set response status and header after creating user
        await User.create(newUser).then(createdUser => {
                res.status(201)
                res.header('location', '/');
            });

        } else {
            res.status(400);
            res.json({"messsage": "No password provided! You must give a first name, last name, and an email address!"});
        }
    } catch (error) {
        
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            console.log(error)
            const errors = error.errors.map(err => err.message);
            res.status(400);
            res.json({ errors });
        } else {
            throw error;
        }
    }
    res.end();

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
router.post('/courses', authenticateUser, asyncHandler(async(req, res) => {
    try{
        let newCourse = {
            "title" : req.body.title,
            "description" : req.body.description,
            "estimated": req.body.estimatedTime,
            "materialsNeeded": req.body.materialsNeeded,
            "userId": req.currentUser.id
        };
        await Course.create(newCourse).then (createdCourse => {
            res.status(201);
            res.header('location', `/courses/${createdCourse.id}`);
        });

    } catch(error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400)
            res.json({ errors });
        } else {
            throw error;
        }
    }
    res.end();
}));


// update a course
router.put('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
    try {
        await Course.update(req.body, {
            where: {
                id: req.params.id,
                userId: req.currentUser.id
            }
        }).then (updatedCourse => {
            if(updatedCourse !== null && typeof(updatedCourse) !== 'undefined' && updatedCourse.length >0){
                if(updatedCourse[0] > 0){
                    res.status(200);
                    res.header('location', `/course/${req.params.id}`);
                    res.json({"message": 'Course updated succesfully!'})
                } else {
                    res.status(403);
                    res.json({"message":"You are not authorized to update information for this course!"});
                } 
            } else {
                    res.status(404);
                    res.json({"message": "Record not found"})
                }
            })

    } catch(error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400);
            res.json({ errors });
            
        } else {
            throw error;
        }
    } 
    res.end();
    
    })
);


// delete a course
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res) => {
    try {
        await Course.destroy({
            where: {
                id: req.params.id,
                userId: req.currentUser.id
            }
        }).then(function(rowDeleted){
            if(rowDeleted === 1){
                res.status(204);
                res.header('location', '/');
            } else {
                res.status(403);
                res.json({"message":"No authorization to delete this"})
            }
        }
    
    ).catch(function (error){
        res.status(500).json(error.message);
    });
    } catch(error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const errors = error.errors.map(err => err.message);
            res.status(400)
            res.json({ errors });
        } else {
            throw error;
        }
    }
    res.end();
}));





module.exports = router