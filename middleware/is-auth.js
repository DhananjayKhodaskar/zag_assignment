const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Extract the Authorization header from the incoming request
  const authHeader = req.get('Authorization');

  // Check if the Authorization header exists
  if (!authHeader) {
    // If the Authorization header does not exist, throw an error
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  // Extract the JWT token from the Authorization header
  const token = authHeader.split(' ')[1];

  let decodedToken;

  try {
    // Verify the JWT token using the secret key
    decodedToken = jwt.verify(token, 'somesupersecretsecret');
  } catch (err) {
    // If an error occurs while verifying the token, throw an error
    err.statusCode = 500;
    throw err;
  }

  // If the token is not decoded, throw an error
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  // Set the userId property of the request object to the userId decoded from the token
  req.userId = decodedToken.userId;

  // Call the next middleware function
  next();
};
