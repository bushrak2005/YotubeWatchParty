import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom, joinRoom } from "../services/roomService";

function Home() {
  const [mode, setMode] = useState("create"); // "create" or "join"
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

      if (data?.room?.roomId) {
        navigate(`/room/${data.room.roomId}`, {
          state: { username },
        });
      }
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

      if (!data.success) {
        alert(data.message);
        return;
      }

      navigate(`/room/${roomId}`, {
        state: { username },
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1 className="home-title">Youtube Watch Party</h1>

        {/* Username Field - Always required */}
        <input
          type="text"
          className="input-field"
          placeholder="Enter Your Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Mode Switch Tabs */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid var(--card-border)",
              backgroundColor: mode === "create" ? "var(--accent-purple)" : "transparent",
              color: mode === "create" ? "#fff" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => setMode("create")}
          >
            Create Room
          </button>
          <button
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid var(--card-border)",
              backgroundColor: mode === "join" ? "#2ed573" : "transparent",
              color: mode === "join" ? "#000" : "var(--text-muted)",
              cursor: "pointer",
              fontWeight: "600",
            }}
            onClick={() => setMode("join")}
          >
            Join Room
          </button>
        </div>

        {/* CREATE MODE FORM */}
        {mode === "create" && (
          <div>
            <input
              type="text"
              className="input-field"
              placeholder="Room Name (to Create)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
            />
            <button className="btn-primary" onClick={handleCreateRoom}>
              Create New Room
            </button>
          </div>
        )}

        {/* JOIN MODE FORM */}
        {mode === "join" && (
          <div>
            <input
              type="text"
              className="input-field"
              placeholder="Enter Room Code (to Join)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            />
            <button
              className="btn-primary"
              style={{ backgroundColor: "#2ed573", color: "#000" }}
              onClick={handleJoinRoom}
            >
              Join Existing Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
