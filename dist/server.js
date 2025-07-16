"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));

dotenv_1.default.config();

const app = (0, express_1.default)();

// Removed: app.use(cors());

app.use(express_1.default.json());

app.get('/', (req, res) => {
    res.send('Luxone Quotation System API By Amir');
});

app.use('/api', routes_1.default);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on https://luxonebackendrepo.onrender.com`);
});
