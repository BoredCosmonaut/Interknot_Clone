import {io, type Socket} from 'socket.io-client';

let socket: Socket | null = null;



export function getSocket(): Socket{
    if(socket) return socket;

    socket = io(import.meta.env.VITE_API_URL, {
        auth: {token: localStorage.getItem('token')},
        autoConnect:true
    });
    

    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

