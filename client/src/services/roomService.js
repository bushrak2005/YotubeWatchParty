const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_URL = `${BACKEND_URL}/api/rooms`;

export const createRoom = async (roomData) => {
  const response = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roomData),
  });

  return await response.json();
};

export const joinRoom = async (roomData) => {
  const response = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roomData),
  });

  return await response.json();
};

export const changeVideo = async (videoData) => {
  const response = await fetch(`${API_URL}/change-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(videoData),
  });

  return await response.json();
};