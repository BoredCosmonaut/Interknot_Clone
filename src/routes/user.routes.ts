import { Router } from "express";
import { profile,userPosts } from "../controllers/user.controller.js";

const router = Router();

router.get('/:username',profile);
router.get('/:username/posts',userPosts);

export default router;