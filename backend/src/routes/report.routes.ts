import { Router } from 'express';
import { create } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.post('/', requireAuth, create);
export default router;