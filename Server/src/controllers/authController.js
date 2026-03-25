const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan, createdAt: user.createdAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, plan: user.plan, createdAt: user.createdAt },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update profile
// @route PUT /api/auth/me
const updateProfile = async (req, res) => {
  try {
    const { name, password, cronTime } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters long and contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.' 
        });
      }
      user.password = password;
    }
    if (cronTime) user.cronTime = cronTime;

    await user.save();

    // Re-fetch to omit password
    const updatedUser = await User.findById(req.user._id);

    res.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update SMTP / Gmail configuration
// @route PUT /api/auth/smtp-config
const updateSmtpConfig = async (req, res) => {
  try {
    const { smtpEmail, smtpPassword, smtpHost, smtpPort } = req.body;

    if (!smtpEmail || !smtpPassword) {
      return res.status(400).json({ success: false, message: 'Email and App Password are required.' });
    }

    // Test the SMTP connection before saving
    const nodemailer = require('nodemailer');
    const testTransport = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: smtpPort || 587,
      secure: false,
      auth: { user: smtpEmail, pass: smtpPassword },
    });

    try {
      await testTransport.verify();
    } catch (verifyErr) {
      return res.status(400).json({
        success: false,
        message: `SMTP verification failed: ${verifyErr.message}. Make sure you are using a Gmail App Password, not your regular password.`,
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'smtp.email': smtpEmail.toLowerCase(),
      'smtp.password': smtpPassword,
      'smtp.host': smtpHost || 'smtp.gmail.com',
      'smtp.port': smtpPort || 587,
      'smtp.configured': true,
    });

    res.json({ success: true, message: 'Gmail SMTP configured successfully! Reminders will now be sent from your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Remove SMTP configuration
// @route DELETE /api/auth/smtp-config
const removeSmtpConfig = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      'smtp.email': null, 'smtp.password': null, 'smtp.configured': false,
    });
    res.json({ success: true, message: 'SMTP configuration removed. Ethereal/system SMTP will be used.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, updateSmtpConfig, removeSmtpConfig };

