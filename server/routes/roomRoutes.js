const express = require("express");

const router = express.Router();

const {
  createRoom,
  joinRoom,
  changeVideo,
} = require("../controllers/roomController");

// create room
router.post("/create", createRoom);
// join room
router.post("/join", joinRoom);
// change video
router.post("/change-video", changeVideo);

module.exports = router;
