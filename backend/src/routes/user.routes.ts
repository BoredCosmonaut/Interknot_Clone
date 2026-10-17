import { Router } from "express";
import { profile,updateMe,userPosts } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";
const router = Router();

router.patch('/me', requireAuth, uploadAvatar, updateMe);
router.get('/:username',profile);
router.get('/:username/posts',userPosts);

export default router;