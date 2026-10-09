import type {Request,Response,NextFunction} from 'express';
import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req:Request,res:Response,next:NextFunction){
    const header = req.headers.authorization;

    if(!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({message:'Not authenticated'});
    }

    const token = header.slice(7);

    try {
        req.user = verifyToken(token);
        console.log('auth ok, user:', req.user);
        next();
    } catch {
        return res.status(401).json({error: 'Invalid or expired token'})
    }
}