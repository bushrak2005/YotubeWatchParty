import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import socket from "../socket/socket";
import YouTubePlayer from "../components/YouTubePlayer";
import { changeVideo } from "../services/roomService";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = location.state?.username || "Guest";

  const [participants, setParticipants] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [userRole, setUserRole] = useState("Participant");

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const playerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const chatBottomRef = useRef(null);

  const canControl = userRole === "Host" || userRole === "Moderator";

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-room", { roomId, username });

    socket.on("sync-state", (data) => {
      if (data?.videoId) setVideoId(data.videoId);
      if (data?.userRole) setUserRole(data.userRole);
    });

    socket.on("user-joined", (data) => {
      const list = data?.participants || [];
      setParticipants(list);
      const me = list.find((p) => p.username.toLowerCase() === username.toLowerCase());
      if (me) setUserRole(me.role);
    });

    socket.on("user-left", (data) => {
      setParticipants(data?.participants || []);
    });

    socket.on("video-changed", (data) => {
      if (data?.videoId) setVideoId(data.videoId);
    });

    socket.on("play-video", async ({ currentTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      try {
        if (currentTime !== undefined) {
          const pTime = await playerRef.current.getCurrentTime();
          if (Math.abs(pTime - currentTime) > 0.5) {
            await playerRef.current.seekTo(currentTime, true);
          }
        }
        await playerRef.current.playVideo();
      } catch (err) {
        console.error("Error handling remote play:", err);
      }
    });

    socket.on("pause-video", async ({ currentTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      try {
        if (currentTime !== undefined) {
          await playerRef.current.seekTo(currentTime, true);
        }
        await playerRef.current.pauseVideo();
      } catch (err) {
        console.error("Error handling remote pause:", err);
      }
    });

    socket.on("seek-video", async ({ currentTime }) => {
      if (!playerRef.current) return;
      isRemoteAction.current = true;
      try {
        if (currentTime !== undefined) {
          await playerRef.current.seekTo(currentTime, true);
        }
      } catch (err) {
        console.error("Error handling remote seek:", err);
      }
    });

    socket.on("role-assigned", (data) => {
      const list = data?.participants || [];
      setParticipants(list);
      const me = list.find((p) => p.username.toLowerCase() === username.toLowerCase());
      if (me) setUserRole(me.role);
    });

    socket.on("kicked-out", () => {
      alert("You have been removed from the watch party.");
      navigate("/");
    });

    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("sync-state");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("video-changed");
      socket.off("play-video");
      socket.off("pause-video");
      socket.off("seek-video");
      socket.off("role-assigned");
      socket.off("kicked-out");
      socket.off("receive-message");
    };
  }, [roomId, username, navigate]);

  const handleChangeVideo = async () => {
    if (!videoUrl) return;

    const match = videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    const id = match ? match[1] : null;

    if (!id) {
      alert("Invalid YouTube URL");
      return;
    }

    try {
      await changeVideo({ roomId, videoId: id });
      setVideoId(id);
      socket.emit("change-video", { roomId, videoId: id });
      setVideoUrl("");
    } catch (error) {
      console.error("Failed to change video:", error);
    }
  };

  const handlePlayerReady = (playerInstance) => {
    playerRef.current = playerInstance;
  };

  const handlePlayerStateChange = async (event) => {
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
      return;
    }

    if (!canControl) return;

    if (!playerRef.current) return;
    const currentTime = await playerRef.current.getCurrentTime();

    if (event.data === 1) socket.emit("play-video", { roomId, currentTime });
    if (event.data === 2) socket.emit("pause-video", { roomId, currentTime });
    if (event.data === 3) socket.emit("seek-video", { roomId, currentTime });
  };

  const handleAssignRole = (targetUsername, currentRole) => {
    const newRole = currentRole === "Moderator" ? "Participant" : "Moderator";
    socket.emit("assign-role", { roomId, targetUsername, newRole });
  };

  const handleRemoveParticipant = (targetUsername) => {
    socket.emit("remove-participant", { roomId, targetUsername });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    socket.emit("send-message", {
      roomId,
      username,
      message: chatInput,
    });

    setChatInput("");
  };

  const getBadgeClass = (role) => {
    if (role === "Host") return "badge badge-host";
    if (role === "Moderator") return "badge badge-moderator";
    return "badge badge-participant";
  };

  return (
    <div className="room-container">
      {/* Header */}
      <header className="header">
        <div className="logo-group">
          <span className="logo">🍿 WatchParty</span>
          <span className="room-code-tag">Room Code: {roomId}</span>
        </div>
        <div className="user-badge-group">
          <span>{username}</span>
          <span className={getBadgeClass(userRole)}>{userRole}</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="main-layout">
        {/* Left Column: Player & Controls */}
        <section className="video-column">
          {canControl && (
            <div className="url-bar">
              <input
                type="text"
                className="input-field"
                placeholder="Paste YouTube Video URL here..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <button
                className="btn-primary"
                style={{ width: "auto", marginBottom: 0 }}
                onClick={handleChangeVideo}
              >
                Load Video
              </button>
            </div>
          )}

          <div className="player-wrapper-card">
            <YouTubePlayer
              videoId={videoId}
              onReady={handlePlayerReady}
              onStateChange={handlePlayerStateChange}
              canControl={canControl}
            />
          </div>
        </section>

        {/* Right Column: Participants & Chat */}
        <aside className="sidebar">
          {/* Participants Card */}
          <div className="card">
            <h3 className="card-title">Participants ({participants.length})</h3>
            <div className="participant-list">
              {participants.map((p) => (
                <div key={p.username} className="participant-item">
                  <div>
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{p.username} </span>
                    <span className={getBadgeClass(p.role)}>{p.role}</span>
                  </div>

                  {userRole === "Host" &&
                    p.username.toLowerCase() !== username.toLowerCase() && (
                      <div>
                        <button
                          className="action-btn"
                          onClick={() => handleAssignRole(p.username, p.role)}
                        >
                          {p.role === "Moderator" ? "Demote" : "Mod"}
                        </button>
                        <button
                          className="action-btn-danger"
                          onClick={() => handleRemoveParticipant(p.username)}
                        >
                          Kick
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat Card */}
          <div className="card chat-card">
            <h3 className="card-title">Live Chat</h3>
            <div className="chat-box">
              {messages.length === 0 ? (
                <p style={{ color: "#666", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="chat-message">
                    <div className="chat-meta">
                      <span className="chat-user">{msg.username}</span>
                      <span>{msg.time}</span>
                    </div>
                    <div>{msg.message}</div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                className="input-field"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ marginBottom: 0 }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{ width: "auto", marginBottom: 0 }}
              >
                Send
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Room;
