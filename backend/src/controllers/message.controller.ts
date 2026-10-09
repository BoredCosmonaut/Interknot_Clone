import type { Response,Request } from "express";
import { getConversation,getInbox } from "../models/message.model.js";
import { findPublicUserById } from "../models/user.model.js";

export async function conversation(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not authenticated'});
    }

    const otherId = Number(req.params.userId);

     if (!Number.isInteger(otherId) || otherId < 1) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    const limit = Math.min(Number(req.query.limit)|| 50,100);
    const offset = Number(req.query.offset) || 0;
    try {
        const other = await findPublicUserById(otherId);

        if(!other) {
            return res.status(404).json({ error: 'User not found' });
        }

        const messages = await getConversation(req.user.userId,otherId,limit,offset);
        return res.json(messages);
    } catch (err) {
        console.error('Convo failed:',err);
        return res.status(500).json({message:'Something went wrong'});
    }
}

export async function inbox(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not authenticated'});
    }

    try {
        const conversations = await getInbox(req.user.userId);

        return res.json(conversations);
    } catch (err) {
        console.error('Inbox failed',err);
        return res.status(500).json({error:'Something went wrong'});
    }

}