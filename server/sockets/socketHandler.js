const Room = require("../models/Room");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // --- 1. JOIN ROOM ---
    socket.on("join-room", async ({ roomId, username }) => {
      try {
        if (!roomId || !username) return;

        socket.data.roomId = roomId;
        socket.data.username = username;

        socket.join(roomId);

        console.log(`${username} joined room ${roomId}`);

        const room = await Room.findOne({ roomId });
        if (!room) {
          socket.emit("error_msg", "Room not found");
          return;
        }

        // Case-insensitive lookup for existing participant
        let participant = room.participants.find(
          (p) => p.username.toLowerCase() === username.toLowerCase()
        );

        let role = "Participant";

        if (participant) {
          participant.socketId = socket.id;
          role = participant.role;
        } else {
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
        if (role === "Host" && room.host) {
          room.host.socketId = socket.id;
          room.host.username = username;
        }

        await room.save();

        console.log(`User ${username} connected with role: ${role}`);

        // Emit current room state and role directly to the joining socket
        socket.emit("sync-state", {
          videoId: room.currentVideo || "",
          userRole: role,
          isPlaying: room.isPlaying || false,
          currentTime: room.currentTime || 0,
        });

        // Broadcast updated participant list and current videoId to everyone in room
        io.to(roomId).emit("user-joined", {
          participants: room.participants,
          videoId: room.currentVideo || "",
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
        socket.to(roomId).emit("pause-video", { currentTime });
      } catch (error) {
        console.error("pause-video error:", error);
      }
    });

    // --- 5. SEEK VIDEO ---
    socket.on("seek-video", async ({ roomId, currentTime }) => {
      try {
        await Room.updateOne({ roomId }, { currentTime });
        socket.to(roomId).emit("seek-video", { currentTime });
      } catch (error) {
        console.error("seek-video error:", error);
      }
    });

    // --- 6. ASSIGN ROLE ---
    socket.on("assign-role", async ({ roomId, targetUsername, newRole }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const target = room.participants.find(
          (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
        );

        if (target) {
          target.role = newRole;
          await room.save();

          // Broadcast role updates AND active video state so player loads immediately
          io.to(roomId).emit("role-assigned", {
            participants: room.participants,
            videoId: room.currentVideo || "",
            isPlaying: room.isPlaying || false,
            currentTime: room.currentTime || 0,
          });
        }
      } catch (error) {
        console.error("assign-role error:", error);
      }
    });

    // --- 7. REMOVE PARTICIPANT ---
    socket.on("remove-participant", async ({ roomId, targetUsername }) => {
      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const targetIndex = room.participants.findIndex(
          (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
        );

        if (targetIndex !== -1) {
          const removedParticipant = room.participants[targetIndex];

          room.participants.splice(targetIndex, 1);
          await room.save();

          // Broadcast kick event room-wide with normalized lowercased username
          io.to(roomId).emit("kicked-out", {
            targetUsername: removedParticipant.username,
            targetUsernameLower: removedParticipant.username.toLowerCase(),
          });

          // Broadcast updated participant list
          io.to(roomId).emit("user-joined", {
            participants: room.participants,
            videoId: room.currentVideo || "",
          });
        }
      } catch (error) {
        console.error("remove-participant error:", error);
      }
    });

    // --- 8. SEND CHAT MESSAGE ---
    socket.on("send-message", ({ roomId, username, message }) => {
      try {
        if (!message || !message.trim()) return;

        io.to(roomId).emit("receive-message", {
          username,
          message,
          time: new Date().toISOString(),
        });
      } catch (error) {
        console.error("send-message error:", error);
      }
    });

    // --- 9. DISCONNECT ---
    socket.on("disconnect", async () => {
      console.log(`User Disconnected: ${socket.id}`);

      const { roomId, username } = socket.data || {};

      if (!roomId) return;

      try {
        const room = await Room.findOne({ roomId });
        if (!room) return;

        const participant = room.participants.find(
          (p) =>
            p.socketId === socket.id ||
            (username && p.username.toLowerCase() === username.toLowerCase())
        );

        if (participant) {
          participant.socketId = "";
          await room.save();

          io.to(roomId).emit("user-left", {
            participants: room.participants,
          });
        }
      } catch (error) {
        console.error("disconnect cleanup error:", error);
      }
    });
  });
};

module.exports = socketHandler;
