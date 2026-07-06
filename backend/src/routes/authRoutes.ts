import { Router } from 'express';
import { login, createInitialUser } from '../controllers/authController';

const router = Router();

router.post('/login', login);
// Utility route to seed the first warden/owner account
router.post('/seed', createInitialUser);

export default router;
