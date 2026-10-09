import { Router } from "express";
import { create,feed,byId, removePost} from "../controllers/post.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { uploadImage } from "../middleware/upload.middleware.js";

const router = Router();

router.get('/',feed);
router.get('/:id',byId);
router.post('/',requireAuth,uploadImage,create);
router.delete('/:id',requireAuth,removePost)
export default router;