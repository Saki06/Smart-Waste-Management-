require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const { connectToMongo } = require("./src/config/db");
const { setupMQTT } = require("./src/config/mqtt");
const { setupSockets } = require("./src/sockets/socketHandler");

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Setup WebSockets
const io = new Server(server, { cors: { origin: "*" } });

// Attach io to app so controllers can use it
app.set('io', io);

// Initialize Socket event handlers
setupSockets(io);

// Start the Application
server.listen(PORT, async () => {
    // 1. Connect to Database
    await connectToMongo();
    
    // 2. Start MQTT Subscriber
    setupMQTT(io);
    
    console.log(`🚀 Unified API & WebSocket Server running on http://localhost:${PORT}`);
    console.log(`📡 Listening for MQTT messages...`);
});
