import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const allowedOrigins = ['https://quotation.theluxone.com']; // your frontend domain(s)

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      // Allow requests like Postman or server-to-server without origin
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware for all routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests globally with CORS headers and 204 status
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

// For JSON body parsing
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});

// Generic error handler for CORS errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error: origin not allowed' });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
