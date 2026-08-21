// index.js — server ki entry file. Yahan se sab kuch shuru hota hai.

require('dotenv').config(); // .env file ki values (PORT, keys) load karta hai

const express = require('express');
const cors = require('cors');

const chatRoute = require('./routes/chat'); // hum agla step mein yeh file banayenge

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN })); // sirf apni React app se requests allow karega
app.use(express.json()); // JSON body parse karne ke liye

app.use('/api/chat', chatRoute); // /api/chat pe koi bhi request chat.js ko jayegi
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server chal raha hai: http://localhost:${PORT}`);
  });
}

module.exports = app;