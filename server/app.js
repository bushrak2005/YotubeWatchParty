const express = require("express");
const cors = require("cors");
const roomRoutes = require("./routes/roomRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/rooms", roomRoutes);

// Test Route
app.get("/", (req, res) => {
    res.send("YouTube Watch Party Backend is Running YAYAYAYAYY");
});

module.exports = app;