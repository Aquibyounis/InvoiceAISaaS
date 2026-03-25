require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const { startCronJob } = require('./src/services/cronService');

// Connect to MongoDB
connectDB();

const app = express();

// Security & middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Raw body for Razorpay webhook verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON body parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'AI Invoice Recovery API is running 🚀', env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/reminders', require('./src/routes/reminders'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  startCronJob();
});

module.exports = app;
