import { Router } from "express";
import { list,markRead,unreadCount } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get('/unread',requireAuth,unreadCount);
router.get('/',requireAuth,list);
router.post('/read',requireAuth,markRead);

export default router;