const Room = require("../models/Room");
const { v4: uuidv4 } = require("uuid");

// ================= CREATE ROOM =================

const createRoom = async (req, res) => {
  try {
    const { roomName, username } = req.body;

    if (!roomName || !username) {
      return res.status(400).json({
        success: false,
        message: "Room name and username are required",
      });
    }

    const room = new Room({
      roomId: uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase(),

      roomName,

      host: {
        username,
        socketId: "",
      },

      participants: [
        {
          username,
          socketId: "",
          role: "Host",
        },
      ],

      currentVideo: "",
      currentTime: 0,
      isPlaying: false,
    });

    await room.save();

    console.log("Saved Room:", room);

    res.status(201).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================= JOIN ROOM =================

const joinRoom = async (req, res) => {
  try {
    const { roomId, username } = req.body;

    if (!roomId || !username) {
      return res.status(400).json({
        success: false,
        message: "Room ID and username are required",
      });
    }

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const alreadyJoined = room.participants.find(
      (participant) => participant.username === username,
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: "Username already exists in this room",
      });
    }

    room.participants.push({
      username,
      socketId: "",
      role: "Participant",
    });

    await room.save();

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const changeVideo = async (req, res) => {
  try {
    const { roomId, videoId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.currentVideo = videoId;

    await room.save();

    res.status(200).json({
      success: true,
      room,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ================= EXPORTS =================

module.exports = {
  createRoom,
  joinRoom,
  changeVideo,
};
