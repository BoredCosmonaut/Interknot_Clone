import type { Request,Response } from "express";
import bcrypt from 'bcrypt';
import { createUser,findUserByUsername } from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";

export async function signup(req:Request, res:Response) {
    const {username,password} = req.body;

    if(typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({error:'Username and password is required'});
    }

    if(username.length < 3 || password.length < 8) {
        return res.status(400).json({ error: 'Username min 3 chars, password min 8' });
    }

    try {
        const existing = await findUserByUsername(username);
        if(existing) {
            return res.status(409).json({error:'Username already taken'});
        }

        const passwrodHash = await bcrypt.hash(password,10);
        const user = await createUser(username,passwrodHash);
        return res.status(201).json({
            id: user.id,
            username:user.username
        })
    } catch (err) {
        if (err instanceof Error && 'code' in err && err.code === '23505') {
            return res.status(409).json({error:'Username already taken'});
        }

        console.error('signup failed:',err);
        return res.status(500).json({error:'Something went wrong'});
    }
}


export async function login(req:Request,res:Response) {
    const {username, password} = req.body;
    if(typeof username !== 'string' || typeof password !== 'string'){
        return res.status(400).json({ error: 'Username and password are required' });
    };

    try {
        const user = await findUserByUsername(username);
        if(!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const match = await bcrypt.compare(password,user.password_hash);
        if(!match) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = signToken({userId:user.id,username:user.username});

        return res.status(200).json({
            token:token,
            user:{id:user.id,username:user.username},
        });
    } catch (err) {
        console.error('login failed:', err);
        return res.status(500).json({ error: 'Something went wrong' });
    }
}