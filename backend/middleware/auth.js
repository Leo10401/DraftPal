const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  try {
    // Enhanced logging for request details
    console.log('Auth middleware - Request details:', {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      cookies: Object.keys(req.cookies || {}),
      cookiesCount: Object.keys(req.cookies || {}).length,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'none',
      queryParams: Object.keys(req.query || {})
    });

    // Get token from multiple possible sources
    let token;
    let tokenSource = 'none';
    
    // 1. Check cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      tokenSource = 'cookie';
      console.log('Auth middleware - Token found in cookies');
    } 
    // 2. Check authorization header (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      tokenSource = 'header';
      console.log('Auth middleware - Token found in authorization header');
    }
    // 3. Check query parameters (as fallback for cross-domain issues)
    else if (req.query && req.query.token) {
      token = req.query.token;
      tokenSource = 'query';
      console.log('Auth middleware - Token found in query parameters');
    }
    
    if (!token) {
      console.log('Auth middleware - No token found in any source');
      return res.status(401).json({ 
        message: 'Not authorized, no token', 
        source: tokenSource,
        hasCookies: Object.keys(req.cookies || {}).length > 0,
        hasAuthHeader: !!req.headers.authorization
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`Auth middleware - Token from ${tokenSource} verified successfully for user ID: ${decoded.id}`);
    
    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log(`Auth middleware - User not found for token (ID: ${decoded.id})`);
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    console.log(`Auth middleware - Authentication successful for user: ${user.email || user._id}`);
    next();
  } catch (error) {
    console.error('Auth middleware error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(401).json({ 
      message: 'Not authorized, token failed', 
      error: error.message 
    });
  }
};