import { Router } from "express";
import { listForPosts,create, } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({mergeParams:true});

router.get('/',listForPosts);
router.post('/',requireAuth,create);

export default router;