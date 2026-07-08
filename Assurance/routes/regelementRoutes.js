// routes/regelementRoutes.js
import fs from "fs";
import path from "path";
import express from "express";
import multer from "multer";
import {
  getRegelementByProduction,
  createOrUpdateRegelementPaiement,
  getAllReglements,
  getAllRegles,
} from "../controllers/regelementController.js";

const router = express.Router();

const uploadDir = path.join("uploads", "regelements");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });



/* ============================================
   ROUTES
============================================ */

// GET /regelements
// jib all regelements, optional filter by client
router.get("/", getAllReglements);
router.get("/all", getAllRegles);

// GET /regelements/:productionId
// jib règlement dyal wahd l'operation (production)
router.get("/:productionId", getRegelementByProduction);

// POST /regelements/:productionId/paiement
// create/update règlement + paiements (FormData + files)
router.post(
  "/:productionId/paiement",
  upload.any(), // bach FormData + files ytsm3o
  createOrUpdateRegelementPaiement
);

export default router;
