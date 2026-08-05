const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Join Room
    socket.on("join-room", ({ roomId, username }) => {
      socket.join(roomId);

      console.log(`${username} joined room ${roomId}`);

      io.to(roomId).emit("user-joined", {
        message: `${username} joined the room`,
        username,
        roomId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;