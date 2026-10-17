import type { Response,Request } from "express";
import { findPublicUserById, findPublicUserByUsername,updateUserProfile } from "../models/user.model.js";
import { getPostsByAuthor } from "../models/post.model.js";
import sharp from "sharp";
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';

export async function profile(req:Request,res:Response) {
    const {username} = req.params;

    if(typeof username !== 'string' || username.length === 0) {
        return res.status(400).json({error:'Invalid username'});
    }

    try {
        const user = await findPublicUserByUsername(username);
        if(!user) {
            return res.status(404).json({error:'User not found'});
        }

        return res.json(user);

    } catch (err) {
        console.error('profile failed',err);
        return res.status(500).json({error:'Something went wrong'});
    };
};

export async function userPosts(req:Request,res:Response) {
    const {username} = req.params;
    const limit = Math.min(Number(req.query.limit) || 20 , 50);
    const offset = Number(req.query.offset) || 0;

    if(typeof username !== 'string' || username.length === 0) {
        return res.status(400).json({ error: 'Invalid username' });
    }

    try {
        const user = await findPublicUserByUsername(username);

        if(!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const posts = await getPostsByAuthor(user.id,limit,offset);
        return res.json(posts);

    } catch (err) {
        console.error('user posts failed:',err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}

export async function updateMe(req: Request, res: Response) {
    console.log('updateMe hit, file:', !!req.file);
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { bio, display_name } = req.body;

    if (bio !== undefined && typeof bio !== 'string') {
        return res.status(400).json({ error: 'Bio must be a string' });
    }

    if (typeof bio === 'string' && bio.length > 300) {
        return res.status(400).json({ error: 'Bio too long (max 300)' });
    }

    if (display_name !== undefined) {
        if (typeof display_name !== 'string' || display_name.trim().length === 0) {
        return res.status(400).json({ error: 'Display name cannot be empty' });
        }
        if (display_name.length > 40) {
        return res.status(400).json({ error: 'Display name too long (max 40)' });
        }
    }

    let newAvatarPath: string | null = null;

    try {
        const current = await findPublicUserById(req.user.userId);
        if (!current) {
        return res.status(404).json({ error: 'User not found' });
        }

        if (req.file) {
        const filename = `${crypto.randomBytes(16).toString('hex')}.webp`;

        await sharp(req.file.buffer)
            .resize(256, 256, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(path.join('uploads', filename));

        newAvatarPath = `/uploads/${filename}`;
        }

        const user = await updateUserProfile(
        req.user.userId,
        bio ?? null,
        newAvatarPath,
        display_name?.trim() ?? null
        );

        if (newAvatarPath && current.avatar_url.startsWith('/uploads/')) {
        const old = path.basename(current.avatar_url);
        await fs.unlink(path.join('uploads', old)).catch(() => {});
        }

        return res.json(user);
    } catch (err) {
        if (newAvatarPath) {
        await fs.unlink(path.join('uploads', path.basename(newAvatarPath))).catch(() => {});
        }
        console.error('update profile failed:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}