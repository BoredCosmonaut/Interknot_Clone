import { Router } from "express";
import { listForPosts,create,removeComment,editComment } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({mergeParams:true});

router.get('/',listForPosts);
router.post('/',requireAuth,create);
router.delete('/:commentId',requireAuth,removeComment);
router.patch('/:commentId', requireAuth, editComment);
export default router;