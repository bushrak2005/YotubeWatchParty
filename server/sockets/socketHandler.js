const Room = require("../models/Room");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", async ({ roomId, username }) => {
      try {
        socket.join(roomId);

        console.log(`${username} joined room ${roomId}`);

        // Find room in MongoDB
        const room = await Room.findOne({ roomId });

        if (!room) {
          return;
        }

        // Find participant
        const participant = room.participants.find(
          (p) => p.username === username,
        );

        // Update socket id
        if (participant) {
          participant.socketId = socket.id;
        }

        await room.save();

        // Broadcast updated participants
        io.to(roomId).emit("user-joined", {
          participants: room.participants,
        });
      } catch (error) {
        console.error(error);
      }
    });
    socket.on("change-video", ({ roomId, videoId }) => {
      console.log("Host emitted change-video");
      console.log("Room:", roomId);
      console.log("Video:", videoId);

      io.to(roomId).emit("video-changed", {
        videoId,
      });
    });
    // Play Video
    socket.on("play-video", ({ roomId }) => {
      console.log("Received play-video:", roomId);

      io.to(roomId).emit("play-video");
    });

    // Pause Video
    socket.on("pause-video", ({ roomId }) => {
      console.log("Received pause-video:", roomId);

      io.to(roomId).emit("pause-video");
    });
    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
