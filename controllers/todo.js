// Import required modules
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator/check');

// Import the Task and User models
const Task = require('../models/task');
const User = require('../models/user');

// Define the controller function for fetching tasks
exports.getTasks = (req, res, next) => {
  // Extract the current page number from the query string, or set it to 1 by default
  const currentPage = req.query.page || 1;
  // Set the number of items to display per page
  const perPage = 2;
  // Declare a variable to hold the total number of items (tasks) that match the user's query
  let totalItems;

  // Find the User object that matches the current user's ID and populate its 'tasks' field
  User.findById(req.userId) 
    .populate({
      path: 'tasks',
      options: {
        skip: (currentPage - 1) * perPage,
        limit: perPage,
      },
    })
    .exec()
    .then(user => {
      // If no matching user is found, throw a 404 error
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }
      // Set the totalItems variable to the length of the user's 'tasks' array
      totalItems = user.tasks.length;
      // Send a JSON response to the client with the fetched tasks and other data
      res.status(200).json({
        message: 'Fetched tasks successfully.',
        tasks: user.tasks,
        totalItems: totalItems,
      });
    })
    .catch(err => {
      // If an error occurs during execution, set its status code to 500 (Internal Server Error)
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      // Pass the error object to the Express error-handling middleware
      next(err);
    });
};

// Handler function for creating a new task
exports.createTask = (req, res, next) => {
  // Validate user input using the validationResult function
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  // Get task data from request body
  const name = req.body.name;
  const description = req.body.description;
  const status = req.body.status;
  let creator;
  // Create a new Task object with the provided data and the current user's id as the creator
  const task = new Task({
    name: name,
    description: description,
    status : status,
    creator: req.userId
  });
  // Save the new task object to the database
  task
    .save()
    .then(result => {
      // Find the user who created the task using their user id
      return User.findById(req.userId);
    })
    .then(user => {
      // Save the user object who created the task in a variable called creator
      creator = user;
      // Add the newly created task to the user's list of tasks
      user.tasks.push(task);
      // Save the user object with the updated task list to the database
      return user.save();
    })
    .then(result => {
      // Return a success message with the newly created task and its creator's id and name
      res.status(201).json({
        message: 'Task created successfully!',
        task: task,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => {
      // If there's an error, handle it and pass it to the next middleware function
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// Handler function for fetching a single task by its id
exports.getTask = (req, res, next) => {
  // Get the task id from the request parameters
  const taskId = req.params.taskId;
  // Find the task in the database using its id
  Task.findById(taskId)
    .then(task => {
      // If the task doesn't exist, throw an error
      if (!task) {
        const error = new Error('Could not find task.');
        error.statusCode = 404;
        throw error;
      }
      // If the task is found, return it in a success message
      res.status(200).json({ message: 'Task fetched.', task: task });
    })
    .catch(err => {
      // If there's an error, handle it and pass it to the next middleware function
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


exports.updateTask = (req, res, next) => {
  const taskId = req.params.taskId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }

  const name = req.body.name;
  const description = req.body.description;
  const status = req.body.status;

  Task.findById(taskId)
    .then(task => {
      // If task is not found, throw an error
      if (!task) {
        const error = new Error('Could not find task.');
        error.statusCode = 404;
        throw error;
      }

      // Check if the logged-in user is the creator of the task
      if (task.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
  
      // Update the task
      task.name = name;
      task.description = description;
      task.status = status;
      return task.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Task updated!', task: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


exports.deleteTask = (req, res, next) => {
  const taskId = req.params.taskId;
  // Find the task by ID
  Task.findById(taskId)
    .then(task => {
      // If task is not found, throw a 404 error
      if (!task) {
        const error = new Error('Could not find task.');
        error.statusCode = 404;
        throw error;
      }
      // If the user trying to delete the task is not the creator of the task, throw a 403 error
      if (task.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 403;
        throw error;
      }
      // If the task is found and the user is authorized, delete the task
      return Task.findByIdAndRemove(taskId);
    })
    .then(result => {
      // Find the user who created the task and remove the task from their list of tasks
      return User.findById(req.userId);
    })
    .then(user => {
      user.tasks.pull(taskId);
      return user.save();
    })
    .then(result => {
      // Send a 200 response with a success message
      res.status(200).json({ message: 'Deleted task.' });
    })
    .catch(err => {
      // If there is an error, set the status code and pass the error to the error handling middleware
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};



