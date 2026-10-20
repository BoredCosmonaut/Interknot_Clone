import {io, type Socket} from 'socket.io-client';
import { API_BASE } from './config';

let socket: Socket | null = null;

export function getSocket(): Socket{
    if(socket) return socket;

    socket = io(API_BASE || undefined, {
        auth: {token: localStorage.getItem('token')},
        autoConnect:true
    });
    

    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

