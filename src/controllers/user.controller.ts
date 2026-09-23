import type { Response,Request } from "express";
import { findPublicUserByUsername } from "../models/user.model.js";
import { getPostsByAuthor } from "../models/post.model.js";

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

        return res.status(500).json({user});

    } catch (err) {
        console.error('profile failed',err);
        return res.status(500).json({error:'Something went wrong'});
    };
};

export async function userPosts(req:Request,res:Response) {
    const {username} = req.params;
    const limit = Math.min(Number(req.query.limit) || 20 || 50);
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