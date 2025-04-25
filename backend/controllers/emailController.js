const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const User = require('../models/User');

// Fixed OAuth2 client setup and token refresh
const getOAuth2Client = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.googleTokens || !user.googleTokens.access_token) {
      throw new Error('No access token available. Please re-authenticate with Google.');
    }
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.SERVER_URL}/api/auth/google/callback`
    );
    
    // Set credentials from database
    oauth2Client.setCredentials({
      access_token: user.googleTokens.access_token,
      refresh_token: user.googleTokens.refresh_token,
      expiry_date: user.googleTokens.expiry_date
    });
    
    // Only try to refresh if we have a refresh token
    if (user.googleTokens.refresh_token) {
      // Check if token is expired or about to expire
      const isTokenExpired = user.googleTokens.expiry_date ? 
        (user.googleTokens.expiry_date <= Date.now() + 60000) : true;
        
      if (isTokenExpired) {
        try {
          console.log('Access token expired, attempting to refresh...');
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          // Update tokens in database
          user.googleTokens = {
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token || user.googleTokens.refresh_token,
            expiry_date: credentials.expiry_date
          };
          
          await user.save();
          console.log('Access token refreshed successfully');
        } catch (refreshError) {
          console.error('Token refresh error:', refreshError);
          // Continue with existing token if refresh fails
        }
      }
    } else {
      console.warn(`User ${userId} has no refresh token - token refreshing unavailable`);
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('OAuth2 client error:', error);
    throw new Error('Authentication error: ' + error.message);
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { to, subject, body, attachments } = req.body;
    
    // Validate required fields
    if (!to || !subject || !body) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide recipient, subject and message body' 
      });
    }
    
    // Check if user has refresh token before attempting to send
    if (!req.user.googleTokens || !req.user.googleTokens.refresh_token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token available. Please log out and log back in to re-authenticate with Google.'
      });
    }
    
    // Get OAuth2 client with refreshed token
    const oauth2Client = await getOAuth2Client(req.user._id);
    
    // Create transporter with updated configuration
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: req.user.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: req.user.googleTokens.refresh_token,
        accessToken: oauth2Client.credentials.access_token
      },
      debug: true // Enable debugging
    });
    
    // Email options
    const mailOptions = {
      from: req.user.email,
      to,
      subject,
      html: body,
      attachments: attachments || []
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};