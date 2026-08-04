const express = require("express");

const router = express.Router();

const { createRoom, joinRoom } = require("../controllers/roomController");

// create room
router.post("/create", createRoom);
// join room
router.post("/join", joinRoom);

module.exports = router;