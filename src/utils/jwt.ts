import 'dotenv/config'
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET;

if(!secret) {
    throw new Error('SECRET not set');
}

export interface tokenPayload {
    userId:number;
    username:string;
};

export function signToken(payload: tokenPayload): string {
    return jwt.sign(payload,secret!,{expiresIn:'30d'});
}

export function verifyToken(token:string): tokenPayload{
    return jwt.verify(token,secret!) as tokenPayload;
}