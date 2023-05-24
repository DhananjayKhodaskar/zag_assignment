const path = require('path');
const dotenv = require('dotenv').config();
const PORT = process.env.PORT;
const databaseUrl = process.env.DATABASE_URL;
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
 
const todoRoutes = require('./routes/todo'); // Importing the todo routes module
const authRoutes = require('./routes/auth'); // Importing the auth routes module

const app = express(); // Creating an instance of Express

// Middleware for parsing incoming request bodies in JSON format
app.use(bodyParser.json());

// Middleware for handling CORS issues
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes for handling Todo items and authentication requests
app.use('/todo', todoRoutes);
app.use('/auth', authRoutes);

// Default route for serving index.html
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/index.html');
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

// Connecting to MongoDB Atlas and starting the server
mongoose
  .connect(databaseUrl)
  .then(result => {
    console.log("Connected Succesfully to Database.")
    app.listen(PORT); 
    console.log(`Server is listening on port ${PORT}.`);
  })
  .catch(err => console.log(err));
