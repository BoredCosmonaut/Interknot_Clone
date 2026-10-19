import type { Request,Response,NextFunction } from "express";

export function requireAdmin(req:Request,reS:Response,next:NextFunction) {
    if(!req.user?.isAdmin) {
        return reS.status(403).json({error:'Admin only'});
    }
    next();
}