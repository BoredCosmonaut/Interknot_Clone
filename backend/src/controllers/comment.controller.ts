import { createComment,getCommentsByPost,deleteComment, updateComment, deleteCommentAsAdmin } from "../models/comment.model.js";
import type { Request,Response } from "express";
import { getPostById } from "../models/post.model.js";
import { createNotification } from "../models/notifications.model.js";
import { getIo } from "../sockets/io.js";

export async function create(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not authenticated'});
    }

    const postId = Number(req.params.postId);

    if(!Number.isInteger(postId) || postId < 1) {
        return res.status(400).json({error:'Invalid post id'});
    }

    const {content} = req.body;

    if(typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({ error: 'Content is required' });
    }

    if(content.length > 200) {
        return res.status(400).json({error: 'Comment too long (max 1000)'});
    }

    try {
        const post = await getPostById(postId);

        if(!post) {
            return res.status(404).json({error: 'Post not found'});
        }

        const comment = await createComment(postId,req.user.userId, content.trim());
        if(post.author_id !== req.user.userId) {
            await createNotification(post.author_id,req.user.userId,'comment',postId);
            getIo().to(`user:${post.author_id}`).emit('notification:new');
        }
        return res.status(201).json(comment);
    } catch (err) {
        console.error('create comment failed:', err);
        return res.status(500).json({error:'Something went wrong'});
    };
};

export async function listForPosts(req:Request,res:Response) {
    const postId = Number(req.params.postId);

    if(!Number.isInteger(postId) || postId < 1) {
        return res.status(400).json({error:'Invalid post id'});
    };

    try {
        const comments = await getCommentsByPost(postId);
        return res.json(comments);
    } catch (err) {
        console.error('list comments failed:', err);
        return res.status(500).json({error:'Something went wrong'});
    }
};

export async function removeComment(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not logged in'});
    }

    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(commentId) || commentId < 1) {
        return res.status(400).json({ error: 'Invalid comment id' });
    }

    try {
        const deleted = req.user.isAdmin ? await deleteCommentAsAdmin(commentId) : await deleteComment(commentId,req.user.userId);
        if(!deleted) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        return res.status(204).send();
    } catch (err) {
        return res.status(500).json({error:'Something went wrong'});
    }
}

export async function editComment(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not logged in'});
    }

    const commentId = Number(req.params.commentId);

    if(!Number.isInteger(commentId) || commentId < 1) {
        return res.status(400).json({error:'Invalid comment id'});
    }

    const {content} = req.body;

    if(typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({error:'Content is required'});
    };

    if(content.length > 200) {
        return res.status(400).json({error:'Comment too long (200)'});
    };

    try {
        const comment = await updateComment(commentId,req.user.userId,content.trim());

        if(!comment) {
            return res.status(404).json({error:'Comment not found'});
        }

        return res.json(comment);

    } catch (err) {
        console.error('edit comment failed:',err);
        return res.status(500).json({error:'Something went wrong'});
    }

}