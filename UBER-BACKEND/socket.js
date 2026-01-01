const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: ["http://localhost:5173",
                     "http://localhost:5174", 
                     "http://localhost:3000", 
                     "http://localhost:4000",
                     "https://uber-git-main-adshkumars-projects.vercel.app"],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Fix: Join should receive separate parameters
        socket.on('join', async ({ userId, userType }) => {
            console.log(`Joining: ${userType} ${userId} with socket ${socket.id}`);

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    isOnline: true

                });
                socket.join(`user_${userId}`);
            } else if (userType === 'captain') {
                await captainModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    isOnline: true
                });
                socket.join(`captain_${userId}`);
            }
            console.log(`${userType} ${userId} joined successfully`);
        });

        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    type: 'Point',
                    coordinates: [location.lng, location.ltd]
                }
            });
            console.log(`Updated location for captain ${userId}: [${location.lng}, ${location.ltd}]`);
        });

        socket.on('disconnect', async () => {
            console.log(`Client disconnected: ${socket.id}`);

            // Mark user/captain as offline
            await userModel.findOneAndUpdate({ socketId: socket.id }, {
                socketId: null,
                isOnline: false
            });
            await captainModel.findOneAndUpdate({ socketId: socket.id }, {
                socketId: null,
                isOnline: false
            });
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {
    console.log('Sending message to socket:', socketId, messageObject.event);

    if (io && socketId) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Cannot send message: Socket.io not initialized or no socket ID');
    }
}

// New function to broadcast to all captains in room
const broadcastToCaptains = (captainIds, event, data) => {
    if (!io) {
        console.log('Socket.io not initialized.');
        return;
    }

    captainIds.forEach(captainId => {
        console.log(`Broadcasting to captain: ${captainId}`);
        io.to(`captain_${captainId}`).emit(event, data);
    });
}

module.exports = { initializeSocket, sendMessageToSocketId, broadcastToCaptains };