# 🎬 YouTube Watch Party — Real-Time Video Sync

A full-stack, real-time synchronized YouTube Watch Party web application. Users can create or join watch rooms, sync video playback controls (play, pause, seek, change video) using WebSockets, manage participant roles with Role-Based Access Control (RBAC), and communicate via live chat.

---

## 🚀 Live Deployment
* **Frontend (Vercel):** [https://yotube-watch-party.vercel.app](https://yotube-watch-party.vercel.app)
* **Backend (Render):** `https://youtube-watchparty-backend.onrender.com`

---

## ✨ Implemented Features

### 1. Real-Time Playback Synchronization
* **Play / Pause Sync:** When a host or moderator pauses or plays, all participants in the room mirror the exact playback state instantly.
* **Seek Sync:** Timeline seeking/scrubbing is broadcast across all connected clients in the room.
* **Change Video:** Dynamically paste and load new YouTube video URLs/IDs for everyone in real time.

### 2. Room-Based Architecture & Persistent Storage
* Unique generated **Room Codes** for easy joining and sharing.
* Persistent room state, user sessions, and room metadata stored in **MongoDB Atlas**.

### 3. Role-Based Access Control (RBAC)
* **Host (Creator):** Full control over video playback, changing videos, assigning/demoting roles, and kicking participants.
* **Moderator:** Granted video playback permissions by the host (play/pause, seek, change video).
* **Participant (Default):** Watch-only mode with video controls disabled on the UI and strictly validated on the backend.

### 4. Real-Time Live Chat
* Integrated text chat allowing participants to converse in real time with localized message timestamps across different time zones.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, React Router, CSS
* **Backend:** Node.js, Express.js
* **Real-Time Communication:** Socket.IO (WebSockets)
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Video Integration:** YouTube IFrame Player API
* **Deployment:** Vercel (Client) + Render (Server)

---

## 🏗️ Architecture & Real-Time Flow

The WebSocket server is built using an **Event-Driven Architecture** with Socket.IO:

```text 
  ┌─────────────────┐                 ┌─────────────────┐
  │   Client 1      │                 │    Client 2     │
  │   (Host UI)     │                 │ (Participant UI)│
  └────────┬────────┘                 └────────▲────────┘
           │                                   │
   1. [play / seek]                    3. [sync-state]
           │                                   │
           ▼                                   │
 ┌───────────────────────────────────────────────────────┐
 │                  Node.js + Express                    │
 │               Socket.IO Backend Server                │
 │  - Verifies User Role (RBAC)                          │
 │  - Updates MongoDB Room State                         │
 └──────────────────────────┬────────────────────────────┘
                            │
                  2. Broadcasts Event

```
Local Setup & Installation
Prerequisites
Node.js (v18 or higher)

npm or yarn

MongoDB Atlas database connection string

1. Clone Repository
Bash
git clone https://github.com/bushrak2005/YotubeWatchParty.git
cd YotubeWatchParty
2. Backend Setup (server)
Navigate into the server folder:

Bash
cd server
npm install
Create a .env file in the server directory:

Code snippet
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
Start the backend development server:

Bash
npm start
3. Frontend Setup (client)
Open a new terminal tab and navigate into the client folder:

Bash
cd client
npm install
Create a .env file in the client directory:

Code snippet
VITE_BACKEND_URL=http://localhost:5000
Start the frontend development server:

Bash
npm run dev
Open http://localhost:5173 in your browser.

🔌 WebSocket Events API
Event	Direction	Payload	Description	Permission Required
join-room	Client → Server	{ roomId, username }	Registers user in room and syncs current state	Any
play-video	Client → Server	{ roomId, currentTime }	Emits play action to all participants	Host / Moderator
pause-video	Client → Server	{ roomId, currentTime }	Emits pause action to all participants	Host / Moderator
seek-video	Client → Server	{ roomId, currentTime }	Seeks video playback to specific time	Host / Moderator
change-video	Client → Server	{ roomId, videoId }	Changes active YouTube video for everyone	Host / Moderator
assign-role	Client → Server	{ roomId, targetUsername, newRole }	Promotes/demotes participant role	Host Only
remove-participant	Client → Server	{ roomId, targetUsername }	Kicks participant out of the room	Host Only
send-message	Client → Server	{ roomId, username, message }	Broadcasts live chat message to room	Any

🔮 Future Enhancements
OOP Refactoring: Structuring server handlers into formal JavaScript ES6 classes (Room, Participant).

Cross-Server Scalability: Integrating Redis Pub/Sub with Socket.IO Redis Adapter for horizontal scaling.

User Authentication: Implementing JWT login before joining watch parties.

Emoji Reactions: Floating emoji reactions over video moments.

🎥 Working Application Demo Video
[[https://drive.google.com/file/d/15swgRxApU6YIRElJZgULWKm9TRdN8wQj/view?us](https://drive.google.com/file/d/1MhnxTdbpGJqaXqEH_XrUR6tj-xBWzDnY/view?usp=drive_link)

Note: Click the preview above or watch the video demo here.
