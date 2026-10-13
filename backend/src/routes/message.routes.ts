import { Router } from "express";
import { conversation,inbox, unreadCount,markRead } from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get('/',requireAuth,inbox);
router.get('/unread',requireAuth,unreadCount);
router.get('/:userId',requireAuth,conversation);
router.post('/:userId/read', requireAuth, markRead);
export default router