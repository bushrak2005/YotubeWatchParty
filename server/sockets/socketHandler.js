const Room = require("../models/Room");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // --- 1. JOIN ROOM ---
    socket.on("join-room", async ({ roomId, username }) => {
      try {
        if (!roomId || !username) return;

        socket.join(roomId);

        console.log(`${username} joined room ${roomId}`);

        const room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit("error_msg", "Room not found");
          return;
        }

        // Case-insensitive lookup for existing participant in MongoDB
        let participant = room.participants.find(
          (p) => p.username.toLowerCase() === username.toLowerCase(),
        );

        let role = "Participant";

        if (participant) {
          // Update socketId and retain assigned role (Host / Moderator / Participant)
          participant.socketId = socket.id;
          role = participant.role;
        } else {
          // Fallback: If no participants exist, make first user Host
          if (room.participants.length === 0) {
            role = "Host";
          }

          participant = {
            username: username,
            socketId: socket.id,
            role: role,
          };
          room.participants.push(participant);
        }

        // Update main host socketId if user is Host
        if (role === "Host") {
          room.host.socketId = socket.id;
          room.host.username = username;
        }

        await room.save();

        console.log(`User ${username} connected with role: ${role}`);

        // Emit current video and user role directly back to joining socket
        socket.emit("sync-state", {
          videoId: room.currentVideo || "",
          userRole: role,
        });

        // Broadcast updated participant list to everyone in room
        io.to(roomId).emit("user-joined", {
          participants: room.participants,
        });
      } catch (error) {
        console.error("join-room error:", error);
      }
    });

    // --- 2. CHANGE VIDEO ---
    socket.on("change-video", async ({ roomId, videoId }) => {
      try {
        await Room.updateOne({ roomId }, { currentVideo: videoId });
        io.to(roomId).emit("video-changed", { videoId });
      } catch (error) {
        console.error("change-video error:", error);
      }
    });

    // --- 3. PLAY VIDEO ---
    socket.on("play-video", async ({ roomId, currentTime }) => {
      try {
        await Room.updateOne({ roomId }, { isPlaying: true, currentTime });
        socket.to(roomId).emit("play-video", { currentTime });
      } catch (error) {
        console.error("play-video error:", error);
      }
    });

    // --- 4. PAUSE VIDEO ---
    socket.on("pause-video", async ({ roomId, currentTime }) => {
      try {
        await Room.updateOne({ roomId }, { isPlaying: false, currentTime });
        // Emits pause event to every socket in the room EXCEPT the sender
        socket.to(roomId).emit("pause-video", { currentTime });
      } catch (error) {
        console.error("pause-video error:", error);
      }
    });
    socket.on("seek-video", async ({ roomId, currentTime }) => {
      try {
        await Room.updateOne({ roomId }, { currentTime });
        socket.to(roomId).emit("seek-video", { currentTime });
      } catch (error) {
        console.error("seek-video error:", error);
      }
    });
    // --- 5. ASSIGN ROLE ---
    socket.on("assign-role", async ({ roomId, targetUsername, newRole }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const target = room.participants.find(
          (p) => p.username.toLowerCase() === targetUsername.toLowerCase(),
        );

        if (target) {
          target.role = newRole;
          await room.save();

          io.to(roomId).emit("role-assigned", {
            participants: room.participants,
          });
        }
      } catch (error) {
        console.error("assign-role error:", error);
      }
    });

    // --- 6. REMOVE PARTICIPANT ---
    socket.on("remove-participant", async ({ roomId, targetUsername }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const targetIndex = room.participants.findIndex(
          (p) => p.username.toLowerCase() === targetUsername.toLowerCase(),
        );

        if (targetIndex !== -1) {
          const removedParticipant = room.participants[targetIndex];
          room.participants.splice(targetIndex, 1);
          await room.save();

          if (removedParticipant.socketId) {
            io.to(removedParticipant.socketId).emit("kicked-out");
          }

          io.to(roomId).emit("user-joined", {
            participants: room.participants,
          });
        }
      } catch (error) {
        console.error("remove-participant error:", error);
      }
    });
    // --- 7. SEND CHAT MESSAGE ---
    socket.on("send-message", ({ roomId, username, message }) => {
      if (!message || !message.trim()) return;

      io.to(roomId).emit("receive-message", {
        username,
        message,
        // Send standard ISO string instead of pre-formatted server time
        time: new Date().toISOString(),
      });
    });

    // --- 8. DISCONNECT ---
    socket.on("disconnect", () => {
      console.log(`User Disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
