// Import required modules
const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the User model
const User = require('../models/user');

// Signup function
exports.signup = (req, res, next) => {
  // Validate the request body using the express-validator package
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, create an error object and throw it
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  // Extract email, name, and password from the request body
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  // Hash the password using bcryptjs
  bcrypt
    .hash(password, 12)
    .then(hashedPw => {
      // Create a new user object with email, name, and hashed password
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      // Save the user to the database
      return user.save();
    })
    .then(result => {
      // If user is saved successfully, return a success message and user ID
      res.status(201).json({ message: 'User created!', userId: result._id });
    })
    .catch(err => {
      // If there's an error, set the status code to 500 and pass the error to the error-handling middleware
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}; 

// Login function
exports.login = (req, res, next) => {
  // Extract email and password from the request body
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  // Find a user with the given email address in the database
  User.findOne({ email: email })
    .then(user => {
      // If no user is found, throw an error
      if (!user) {
        const error = new Error('A user with this email could not be found.');
        error.statusCode = 401;
        throw error;
      }
      // If a user is found, save the user object to loadedUser variable and compare passwords
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(isEqual => {
      // If passwords don't match, throw an error
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      // If passwords match, generate a JWT token and return it along with the user ID
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        'somesupersecretsecret', // Secret key used to sign the token
        { expiresIn: '1h' } // Token expiry time
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
    })
    .catch(err => {
      // If there's an error, set the status code to 500 and pass the error to the error-handling middleware
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
