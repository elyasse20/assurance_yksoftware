import express from 'express';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import natureRoutes from './routes/natureRoutes.js';
import compagneRoutes from './routes/compagneRoutes.js';
import parametreRoutes from './routes/parametreRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import Tvaroutes from './routes/TVAroutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import regelementRoutes from './routes/regelementRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: "*", credentials: true }));

// Serve static files in /uploads via /api/uploads
app.use("/api/uploads", express.static(join(__dirname, "uploads")));

app.use(express.json());
app.use('/api/users', userRoutes);
app.use(protect);
app.use('/api/clients', clientRoutes);
app.use('/api/natures', natureRoutes);
app.use('/api/compagnes', compagneRoutes);
app.use('/api/parametres', parametreRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tva', Tvaroutes);
app.use("/api/regelements", regelementRoutes);
app.use("/uploads", express.static("uploads"));

app.listen(5000, () => console.log('Server running on port 5000'));
