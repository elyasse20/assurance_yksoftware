// routes/productionRoutes.js
import express from 'express';
import {
  createProduction,
  getAllProductions,
  getProductionById,
  updateProduction,
  deleteProduction
} from '../controllers/productionController.js';

const router = express.Router();

router.post('/', createProduction);
router.get('/', getAllProductions);
router.get('/:id', getProductionById);
router.put('/:id', updateProduction);
router.delete('/:id', deleteProduction);

export default router;
