import { io } from 'socket.io-client';

export const initSocket = () => {
    const options = {
        'force new connection': true,
        reconnectionAttempts: 'Infinity',
        timeout: 10000,
        transports: ['websocket', 'polling']
    };

    const socket = io("http://localhost:8000", options);

    socket.on('connect', () => {
        console.log('Socket connected successfully', socket.id);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    return socket;
};