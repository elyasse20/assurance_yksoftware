import express from 'express';
import multer from 'multer';
import { addClient, getClients, getClient, updateClient, deleteClient } from '../controllers/clientController.js';

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// 🟢 Multer must be first. Protect must come AFTER it.
router.post('/', upload.single('doc'), addClient);
router.put('/:id', upload.single('doc'), updateClient);
router.get('/',  getClients);
router.get('/:id', getClient);
router.delete('/:id', deleteClient);


export default router;

