"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const promise_1 = __importDefault(require("mysql2/promise"));
dotenv_1.default.config();
// Support both DB_PASSWORD and legacy DB_PASS
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASS || undefined;
// Minimal diagnostic (no secrets)
console.log('DB config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    hasPassword: Boolean(dbPassword),
    name: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    env: process.env.NODE_ENV,
});
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: dbPassword,
    database: process.env.DB_NAME || 'luxone_quotation_system',
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
