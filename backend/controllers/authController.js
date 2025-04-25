const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.googleCallback = (req, res) => {
  try {
    // Log OAuth status for debugging
    console.log("User saved with tokens:", { 
      hasAccessToken: !!req.user.googleTokens?.access_token, 
      hasRefreshToken: !!req.user.googleTokens?.refresh_token 
    });
    
    const token = generateToken(req.user._id);
    
    // Set cookie with SameSite and domain settings
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Always use secure in modern browsers
      sameSite: 'none', // Required for cross-site cookie setting
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    // Redirect to frontend home page
    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-googleTokens');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photo: user.photo,
        hasRefreshToken: !!req.user.googleTokens?.refresh_token // Add this for client-side checking
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a new function to handle re-authentication
exports.requestReauth = (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Re-authentication required', 
    authUrl: '/api/auth/google' 
  });
};