const logger = require('../utils/logger');

const connectedUsers = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Authenticate socket
    socket.on('authenticate', (userId) => {
      if (userId) {
        connectedUsers.set(userId, socket.id);
        socket.join(`user-${userId}`);
        logger.info(`User ${userId} authenticated via socket`);
      }
    });

    // Join restaurant room
    socket.on('join-restaurant', (restaurantId) => {
      socket.join(`restaurant-${restaurantId}`);
      logger.info(`Socket ${socket.id} joined restaurant room: ${restaurantId}`);
    });

    // Leave restaurant room
    socket.on('leave-restaurant', (restaurantId) => {
      socket.leave(`restaurant-${restaurantId}`);
    });

    // Table status update (admin)
    socket.on('update-table-status', ({ restaurantId, tableId, status }) => {
      io.to(`restaurant-${restaurantId}`).emit('table-status-changed', { tableId, status });
    });

    socket.on('disconnect', () => {
      connectedUsers.forEach((socketId, userId) => {
        if (socketId === socket.id) connectedUsers.delete(userId);
      });
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { socketHandler };
