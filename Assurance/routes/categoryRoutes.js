import express from 'express';
import {getCategories,addCategory,deleteCategory,updateCategory} from "../controllers/categoryController.js"
const router = express.Router();
router.post('/',  addCategory);
router.get('/',  getCategories);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
export default router;