import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import socket from "../socket/socket";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();

  const username = location.state?.username;

  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      username,
    });

    socket.on("user-joined", (data) => {
      console.log(data);

      setParticipants(data.participants);
    });

    return () => {
      socket.off("user-joined");
    };
  }, [roomId, username]);

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
    </div>
  );
}

export default Room;