"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));

dotenv_1.default.config();
const app = (0, express_1.default)();

// Allowed frontend origins
const allowedOrigins = [
    "http://localhost:5173", // local dev
    "https://luxoneonlinequotation.vercel.app", // vercel preview
    "https://quotation.theluxone.com" // production
];

// Use custom origin check
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle OPTIONS preflight for all routes
app.options("*", (0, cors_1.default)());

app.use(express_1.default.json());

app.get('/', (req, res) => {
    res.json({ message: 'Luxone Quotation System API', status: 'running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api', routes_1.default);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
