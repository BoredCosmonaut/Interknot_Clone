import { Router } from "express";
import { conversation,inbox } from "../controllers/message.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();
router.get('/',requireAuth,inbox);
router.get('/:userId',requireAuth,conversation);

export default router