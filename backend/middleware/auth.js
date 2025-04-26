const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    // Log request details for debugging
    console.log('Auth middleware - Request details:', {
      path: req.path,
      cookies: req.cookies,
      headers: {
        authorization: req.headers.authorization,
        origin: req.headers.origin
      }
    });

    // Get token from multiple possible sources
    let token;
    
    // 1. Check cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Auth middleware - Token found in cookies');
    } 
    // 2. Check authorization header (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Auth middleware - Token found in authorization header');
    }
    // 3. Check query parameters (as fallback for cross-domain issues)
    else if (req.query && req.query.token) {
      token = req.query.token;
      console.log('Auth middleware - Token found in query parameters');
    }
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token verified successfully');
    
    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Auth middleware - User not found for token');
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};