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

    // Check for token in cookie or authorization header
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                  ? req.headers.authorization.split(' ')[1] : null);
    
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