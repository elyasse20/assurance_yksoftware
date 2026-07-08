import express from 'express';
import { registerUser, loginUser, getUsers, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register'
    ,protect, adminOnly, registerUser);
router.get('/allusers',protect, adminOnly, getUsers);
router.put('/:id',protect, adminOnly, updateUser);
router.delete('/:id',protect, adminOnly, deleteUser);
router.post('/login', loginUser);
router.get('/profile', protect, (req, res) => res.json(req.user));
router.get('/admin', protect, adminOnly, (req, res) => res.json({ msg: 'Admin access granted' }));

export default router;
