import type { Response,Request } from "express";
import { createPost,deletePost,deletePostAsAdmin,getFeed,getPostById } from "../models/post.model.js";
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import crypto from 'node:crypto';

export async function create(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not logged in'});
    }

    if(!req.file) {
        return res.status(400).json({error:'An image is required'});
    }

    const {title,content} = req.body;
    if(typeof title !== 'string' || typeof content !== 'string' || title.trim().length === 0 || content.trim().length === 0) {
        return res.status(400).json({error:'Title and content are required'})
    }

    if(title.length > 50) {
        return res.status(400).json({error:'Title too long (max 50)'});
    }

    const name = crypto.randomBytes(16).toString('hex');
    const filename = `${name}.webp`;

    await sharp(req.file.buffer, { animated: true })
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join('uploads', filename));

    const imageUrl = `/uploads/${filename}`;

    try {
        const post = await createPost(req.user.userId,title.trim(),content.trim(),imageUrl);
        return res.status(201).json(post);
    } catch (err) {
        console.error('failed to create post:',err);
        return res.status(500).json({error:'Somehting went wrong'});
    }

}

export async function feed(req:Request,res:Response) {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    try {
        const posts = await getFeed(limit,offset);
        return res.json(posts);
    } catch (err) {
        console.error('feed failed:',err);
        return res.status(500).json({error:'Something went wrong'});
    }
}

export async function byId(req:Request,res:Response) {
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id< 1){
        return res.status(400).json({error: 'Invalid post id'});
    }

    try {
        const post = await getPostById(id);

        if(!post) {
            return res.status(404).json({error:'Post not found'});
        }

        return res.json(post);
    } catch (err) {
        console.error('get post failed:', err);
        return res.status(500).json({error:'Something went wrong'})
    }
}

export async function removePost(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({message:'Not logged in'});
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid post id' });
    }

    try {
        const post = req.user.isAdmin ? await deletePostAsAdmin(id) : await deletePost(id,req.user.userId);
        if(!post) {
            return res.status(404).json({ error: 'Post not found' });
        };

        const filename = path.basename(post.image_url);
        await fs.unlink(path.join('uploads', filename)).catch(() => {});
        return res.status(204).send();
    } catch (err) {
        console.error('delete post failed:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}