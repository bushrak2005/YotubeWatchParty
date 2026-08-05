import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import socket from "../socket/socket";
import YouTubePlayer from "../components/YouTubePlayer";
import { changeVideo } from "../services/roomService";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username;

  const [participants, setParticipants] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const playerRef = useRef(null);

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      username,
    });

    socket.on("user-joined", (data) => {
      console.log(data);

      setParticipants(data.participants);
    });
    socket.on("video-changed", (data) => {
      console.log("Received video-changed:", data);

      setVideoId(data.videoId);
    });
    socket.on("play-video", () => {
      console.log("Received play-video");
      console.log("Player is:", playerRef.current);

      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    });
    socket.on("pause-video", () => {
      console.log("Received pause-video");
      console.log("Player is:", playerRef.current);

      if (playerRef.current) {
        playerRef.current.pauseVideo();
      }
    });
    return () => {
      socket.off("user-joined");
      socket.off("video-changed");
      socket.off("play-video");
      socket.off("pause-video");
    };
  }, [roomId, username]);
  const handleChangeVideo = async () => {
    if (!videoUrl) return;

    const id = videoUrl.split("v=")[1]?.split("&")[0];

    if (!id) {
      alert("Invalid YouTube URL");
      return;
    }

    try {
      await changeVideo({
        roomId,
        videoId: id,
      });

      setVideoId(id);

      socket.emit("change-video", {
        roomId,
        videoId: id,
      });
    } catch (error) {
      console.error(error);
    }
  };
  const handlePlayerReady = (event) => {
    console.log("Player Ready");

    playerRef.current = event.target;
  };
  const handlePlayerStateChange = (event) => {
    console.log("Player State:", event.data);
  };

  return (
    <div>
      <h1>Room Page</h1>

      <h3>Room ID: {roomId}</h3>

      <h3>Username: {username}</h3>

      <h2>Participants</h2>

      <ul>
        {participants.map((participant) => (
          <li key={participant.username}>
            {participant.username} ({participant.role})
          </li>
        ))}
      </ul>
      <hr />

      <h2>Change Video</h2>

      <input
        type="text"
        placeholder="Paste YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />

      <button onClick={handleChangeVideo}>Load Video</button>

      <hr />

      <YouTubePlayer
        videoId={videoId}
        onReady={handlePlayerReady}
        onStateChange={handlePlayerStateChange}
      />
    </div>
  );
}

export default Room;
