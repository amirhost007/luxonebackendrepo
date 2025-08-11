import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

// CORS Options
const corsOptions = {
  origin: true, // Reflect request origin automatically
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware: Log every request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Enable CORS
app.use(cors());
app.options('*', cors()); // Handle preflight requests

// Parse JSON
app.use(express.json());

// API Routes
app.use('/api', routes);

// Error handler for CORS origin rejections
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error && err.message.startsWith('Origin')) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
