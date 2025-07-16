const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const routes = require('./routes'); // index.js

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxoneonlinequotation.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API routes
app.use('/api', routes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
