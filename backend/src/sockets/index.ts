import type { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { createMessage } from "../models/message.model.js";
import { findPublicUserById } from "../models/user.model.js";

export function registerSocketHandler(io: Server) {
    io.use((socket,next) => {
        const token = socket.handshake.auth.token;
        if(typeof token !== 'string') {
            return next(new Error('Not logged in'));
        }

        try {
            socket.data.user = verifyToken(token);
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'))
        }
    });

    io.on('connection',(socket) => {
        const user = socket.data.user;
        console.log('connected;',user.username);

        socket.join(`user:${user.userId}`);
        socket.on('message:send',async(payload,ack) => {
            const {recipientId,content} = payload ?? {};

            if (!Number.isInteger(recipientId) || recipientId < 1) {
            return ack?.({ error: 'Invalid recipient' });
            }

            if (typeof content !== 'string' || content.trim().length === 0) {
            return ack?.({ error: 'Content is required' });
            }

            if (content.length > 2000) {
            return ack?.({ error: 'Message too long' });
            }

            if (recipientId === user.userId) {
            return ack?.({ error: 'Cannot message yourself' });
            }

            try {
                const res = await findPublicUserById(recipientId);
                if(!res) {
                    return ack?.({error:'User does not exist'})
                }

                const message = await createMessage(user.userId,recipientId,content.trim());
                io.to(`user:${recipientId}`).emit('message:new',message);
                ack?.({message});
            } catch (err) {
                console.error('message send failed:', err);
                ack?.({ error: 'Something went wrong' });
            }
        
        });

        socket.on('disconnect',() => {
            console.log('disconnected:',user.username);
        })

    })
}