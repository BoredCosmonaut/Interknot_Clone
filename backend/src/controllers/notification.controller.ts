import type { Request,Response } from "express";
import { getNotifications,getUnreadNotificationCount,markNotificationsRead } from "../models/notifications.model.js";

export async function list(req:Request,res:Response) {
    if(!req.user){
        return res.status(401).json({error:'Not logged in'});
    };

    try {
        const notifications = await getNotifications(req.user.userId);
        return res.json(notifications);
    } catch (err) {
        console.error('List notifs failed:',err);
        return res.status(500).json({error:'Something went wrong'})
    }
}

export async function unreadCount(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not logged in'});
    }

    try {
        const count = await getUnreadNotificationCount(req.user.userId);
        return res.json({count});
    } catch (err) {
        console.error('Notif count failed:',err);
        return res.status(500).json({error:'Something went wrong'});
    }
};

export async function markRead(req:Request,res:Response) {
    if(!req.user) {
        return res.status(401).json({error:'Not logged in'});
    }

    try {
        await markNotificationsRead(req.user.userId);
        return res.status(204).send();
    } catch (err) {
        console.error('Mark notifs read failed:',err);
        return res.status(500).json({error:'Something went wrong'});
    };
}