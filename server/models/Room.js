const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    roomName: {
      type: String,
      required: true,
      trim: true,
    },

    host: {
      socketId: {
        type: String,
        default: "",
      },
      username: {
        type: String,
        required: true,
      },
    },

    // Participants in the room
    participants: [
      {
        username: {
          type: String,
          required: true,
        },

        socketId: {
          type: String,
          default: "",
        },

        role: {
          type: String,
          enum: ["Host", "Moderator", "Participant"],
          default: "Participant",
        },
      },
    ],

    currentVideo: {
      type: String,
      default: "",
    },

    currentTime: {
      type: Number,
      default: 0,
    },

    isPlaying: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);