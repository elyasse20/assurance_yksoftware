// routes/compagneRoutes.js
import express from 'express';
import {
  createCompagne,
  getAllCompagnes,
  getCompagneById,
  updateCompagne,
  deleteCompagne
} from '../controllers/compagneController.js';

const router = express.Router();

router.post('/', createCompagne);
router.get('/', getAllCompagnes);
router.get('/:id', getCompagneById);
router.put('/:id', updateCompagne);
router.delete('/:id', deleteCompagne);

export default router;
