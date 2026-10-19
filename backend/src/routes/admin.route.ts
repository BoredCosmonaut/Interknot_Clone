import { Router } from 'express';
import { list, resolve } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/reports', list);
router.patch('/reports/:id', resolve);

export default router;