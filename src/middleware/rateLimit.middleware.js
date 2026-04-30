const rateLimit = require("express-rate-limit");


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests
  message: {
    success: false,
    message: "Too many login attempts. Try again after 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false
});

const transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 transactions per minute
  message: {
    success: false,
    message: "Too many transactions. Please slow down"
  }
});

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  message: {
    success: false,
    message: "Too many requests from this IP"
  }
});

module.exports = {
  loginLimiter,
  transactionLimiter,
  globalLimiter
};