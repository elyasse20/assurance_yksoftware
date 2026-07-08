import express from 'express';
import {getParametres,addParametre,deleteParametre,updateParametre, showParametre} from "../controllers/parametreController.js"
const router = express.Router();
router.post('/', addParametre);
router.get('/', getParametres);
router.put('/:id', updateParametre);
router.get('/:id', showParametre);
router.delete('/:id', deleteParametre);

export default router;