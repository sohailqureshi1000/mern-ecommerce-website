const rateLimit = require("express-rate-limit");

// 15 requests per minute, per IP — chat ke liye reasonable hai
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Bohot zyada requests — thodi der ruk kar try karein." },
});

module.exports = { chatLimiter };