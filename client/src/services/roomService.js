const API_URL = "http://localhost:5000/api/rooms";

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