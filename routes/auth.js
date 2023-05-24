const express = require('express');
const { body } = require('express-validator/check');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

// Route for handling user signup requests
router.put(
  '/signup',
  [
    // Middleware for validating email format and checking if it already exists in the database
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    // Middleware for validating password length
    body('password')
      .trim()
      .isLength({ min: 5 }),
    // Middleware for validating name field
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.signup
);

// Route for handling user login requests
router.post('/login', authController.login);

module.exports = router;
