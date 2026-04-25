function setupSockets(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected via WebSocket: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = { setupSockets };
