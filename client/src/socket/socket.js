import { io } from "socket.io-client";

// Vite automatically reads variables starting with "VITE_" from client/.env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
});

export default socket;