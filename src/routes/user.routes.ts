import { Router } from "express";
import { profile,updateMe,userPosts } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { AVATARS } from "../constants/avatars.js";

const router = Router();

router.get('avatars',(_req,res) => res.json(AVATARS))
router.get('/:username',profile);
router.get('/:username/posts',userPosts);
router.patch('/me',requireAuth,updateMe);
export default router;