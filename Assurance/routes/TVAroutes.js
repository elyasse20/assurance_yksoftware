import express from 'express';
import { addTVA, deleteTVA, getACtiveTVA, getTVA, updateTVA } from '../controllers/tvacontroller.js';
const router = express.Router();
router.post('/',  addTVA);
router.get('/',  getTVA);
router.get('/getactivetva',  getACtiveTVA);
router.put('/:id', updateTVA);
router.delete('/:id', deleteTVA);

export default router;