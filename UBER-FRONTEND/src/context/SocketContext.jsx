import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = io(`${import.meta.env.VITE_BASE_URL}`, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true
        });

        socketInstance.on('connect', () => {
            console.log('Connected to server:', socketInstance.id);
            setSocket(socketInstance);
            
            // Join as user or captain based on token
            const userToken = localStorage.getItem('user_token');
            const captainToken = localStorage.getItem('captain_token');
            
            if (userToken) {
                try {
                    const payload = JSON.parse(atob(userToken.split('.')[1]));
                    socketInstance.emit('join', { 
                        userId: payload._id, 
                        userType: 'user' 
                    });
                    console.log('User joined socket room:', payload._id);
                } catch (e) {
                    console.error('Error joining as user:', e);
                }
            }
            
            if (captainToken) {
                try {
                    const payload = JSON.parse(atob(captainToken.split('.')[1]));
                    socketInstance.emit('join', { 
                        userId: payload._id, 
                        userType: 'captain' 
                    });
                    console.log('Captain joined socket room:', payload._id);
                } catch (e) {
                    console.error('Error joining as captain:', e);
                }
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;