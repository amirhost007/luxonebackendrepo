import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();

const corsOriginsFromEnv = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://quotation.theluxone.com',
  'https://luxoneonlinequotation.vercel.app',
  ...corsOriginsFromEnv,
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    console.log('CORS Origin:', origin);
    if (!origin) return callback(null, true); // Allow tools like Postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));             // <---- Add this before routes
app.options('*', cors(corsOptions));    // <---- Handle preflight OPTIONS requests

app.use(express.json());

app.use('/api', routes);

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// Error handler for CORS origin rejections
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof Error && err.message.startsWith('Origin')) {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
