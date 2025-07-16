import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes'; // Make sure this points to your actual routes file

// Load environment variables from .env file
dotenv.config();

// Initialize express app
const app = express();

// Middleware: CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://luxoneonlinequotation.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware: Body Parser
app.use(express.json());

// Basic Test Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Use custom routes
app.use('/api', routes); // Adjust the route path as needed

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
