import express from 'express';
import {getNatures,addNature,deleteNature,updateNature} from "../controllers/natureController.js"
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();
router.post('/',  addNature);
router.get('/',  getNatures);
router.put('/:id', updateNature);
router.delete('/:id', deleteNature);

export default router;