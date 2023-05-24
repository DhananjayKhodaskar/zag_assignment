const express = require('express');
const { body } = require('express-validator/check');

const todoController = require('../controllers/todo');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// Route for getting all tasks for authenticated users
router.get('/tasks', isAuth, todoController.getTasks);

// Route for creating a new task for authenticated users
router.post(
  '/task',
  isAuth,
  [
    // Middleware for validating name field
    body('name')
      .trim()
      .isLength({ min: 5 }),
    // Middleware for validating description field
    body('description')
      .trim()
      .isLength({ min: 5 }),
    // Middleware for validating status field
    body('status')
      .trim()
      .isLength({ min: 4 })
  ],
  todoController.createTask
);

// Route for getting a specific task by ID for authenticated users
router.get('/task/:taskId', isAuth, todoController.getTask);

// Route for updating a specific task by ID for authenticated users
router.put(
  '/task/:taskId', 
  isAuth,
  [
    // Middleware for validating name field
    body('name')
      .trim()
      .isLength({ min: 5 }),
    // Middleware for validating description field
    body('description')
      .trim()
      .isLength({ min: 5 }),
    // Middleware for validating status field
    body('status')
      .trim()
      .isLength({ min: 4 })
  ],
  todoController.updateTask
);

// Route for deleting a specific task by ID for authenticated users
router.delete('/task/:taskId', isAuth, todoController.deleteTask);

module.exports = router;
