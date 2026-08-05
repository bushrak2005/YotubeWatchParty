import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../services/roomService";

function Home() {
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!username || !roomName) {
      alert("Please fill all fields");
      return;
    }

    try {
      const data = await createRoom({
        roomName,
        username,
      });

      console.log(data);

      navigate(`/room/${data.room.roomId}`, {
        state: {
          username,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoinRoom = async () => {
    if (!username || !roomId) {
      alert("Please enter username and room code");
      return;
    }

    try {
      const data = await joinRoom({
        roomId,
        username,
      });

      console.log(data);

      if (!data.success) {
        alert(data.message);
        return;
      }

      navigate(`/room/${roomId}`, {
        state: {
          username,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>YouTube Watch Party</h1>

      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br />
      <br />

      <input
        type="text"
        placeholder="Enter Room Name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
      />

      <br />
      <br />

      <button onClick={handleCreateRoom}>Create Room</button>

      <br />
      <br />

      <input
        type="text"
        placeholder="Enter Room Code"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
      />

      <br />
      <br />

      <button onClick={handleJoinRoom}>Join Room</button>
    </div>
  );
}

export default Home;
