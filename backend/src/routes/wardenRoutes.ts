import express from 'express';
import { getRooms, getStudents } from '../controllers/wardenController';
// import { verifyToken, checkRole } from '../middleware/authMiddleware';

const router = express.Router();

// Temporarily bypass authentication to allow frontend testing without login flow
router.get('/rooms', getRooms);
router.get('/students', getStudents);

export default router;
