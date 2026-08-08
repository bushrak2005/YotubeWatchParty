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
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [kickNotice, setKickNotice] = useState("");

  const playerRef = useRef(null);
  const isRemoteAction = useRef(false);
  const chatBottomRef = useRef(null);
  const redirectTimeout = useRef(null);

  const canControl = userRole === "Host" || userRole === "Moderator";

  // Format message timestamp dynamically to local user time
  const formatMessageTime = (timeString) => {
    if (!timeString) return "";
    const date = new Date(timeString);
    // Checks if valid ISO/Date string; falls back if server sends raw formatted text
    return isNaN(date.getTime())
      ? timeString
      : date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
  };

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Helper to join room
    const joinRoomSession = () => {
      console.log("Emitting join-room:", { roomId, username });
      socket.emit("join-room", { roomId, username });
    };

    // Join room immediately if already connected
    if (socket.connected) {
      joinRoomSession();
    }

    // Auto re-join if socket reconnects after network drop
    socket.on("connect", joinRoomSession);

    socket.on("sync-state", async (data) => {
      console.log("Received sync-state:", data);
      if (data?.videoId) setVideoId(data.videoId);
      if (data?.userRole) setUserRole(data.userRole);

      const serverPlaying = data?.isPlaying || false;
      setIsPlaying(serverPlaying);

      // Force video player state alignment on join
      if (playerRef.current) {
        isRemoteAction.current = true;
        try {
          if (data?.currentTime !== undefined) {
            await playerRef.current.seekTo(data.currentTime, true);
          }
          if (serverPlaying) {
            await playerRef.current.playVideo();
          } else {
            await playerRef.current.pauseVideo();
          }
        } catch (err) {
          console.error("Error aligning sync-state:", err);
        }
      }
    });
    socket.on("user-joined", (data) => {
      console.log("User joined update:", data);
      const list = data?.participants || [];
      setParticipants(list);
      const me = list.find(
        (p) => p.username.toLowerCase() === username.toLowerCase(),
      );
      if (me) setUserRole(me.role);
    });

    socket.on("user-left", (data) => {
      setParticipants(data?.participants || []);
    });

    socket.on("video-changed", (data) => {
      if (data?.videoId) setVideoId(data.videoId);
    });

    socket.on("play-video", async ({ currentTime }) => {
      console.log("Received play-video event:", currentTime);
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
      console.log("Received pause-video event:", currentTime);
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
      console.log("Received seek-video event:", currentTime);
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
      const me = list.find(
        (p) => p.username.toLowerCase() === username.toLowerCase(),
      );
      if (me) setUserRole(me.role);
    });

    socket.on("kicked-out", (data) => {
      const kickedUser = data?.targetUsernameLower || "";
      const myUsername = (username || "").toLowerCase();

      if (kickedUser === myUsername) {
        alert("You have been removed from the watch party.");
        navigate("/");
      }
    });

    socket.on("receive-message", (data) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }

      socket.off("connect", joinRoomSession);
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
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
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

  const handlePlayerReady = async (playerInstance) => {
    playerRef.current = playerInstance;

    // If the host is currently paused when participant joins, force pause
    if (!isPlaying) {
      try {
        await playerInstance.pauseVideo();
      } catch (err) {
        console.error("Error setting initial pause state:", err);
      }
    }
  };

  const handlePlayerStateChange = async (event) => {
    if (isRemoteAction.current) {
      isRemoteAction.current = false;
      return;
    }

    if (!canControl || !playerRef.current) return;

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
      {kickNotice && (
        <div
          style={{
            position: "fixed",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "#ffe6e6",
            color: "#8a1f23",
            border: "1px solid #d88585",
            borderRadius: 12,
            padding: "12px 22px",
            fontWeight: 700,
            boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
            textAlign: "center",
          }}
        >
          {kickNotice}
        </div>
      )}

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
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                      {p.username}{" "}
                    </span>
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
                <p
                  style={{
                    color: "#666",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="chat-message">
                    <div className="chat-meta">
                      <span className="chat-user">{msg.username}</span>
                      <span>{formatMessageTime(msg.time)}</span>
                    </div>
                    <div>{msg.message}</div>
                  </div>
                ))
              )}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
              style={{ display: "flex", gap: "8px" }}
            >
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
