require("dotenv").config();

const http = require("http");

const app = require("./app");
const connectDB = require("./config/db");

connectDB();

// Create HTTP Server
const server = http.createServer(app);

// Import Socket.IO
const { Server } = require("socket.io");

// Create Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Import Socket Handler
const socketHandler = require("./sockets/socketHandler");

// Pass io to socket handler
socketHandler(io);

const PORT = process.env.PORT || 5000;

// Listen using server instead of app
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});