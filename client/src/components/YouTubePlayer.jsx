import React from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = ({ videoId, onReady, onStateChange, canControl }) => {
  if (!videoId) {
    return (
      <div style={{ height: '450px', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        No video loaded yet. Host or Moderator can paste a YouTube URL above.
      </div>
    );
  }

  const opts = {
    height: '450',
    width: '100%',
    playerVars: {
      autoplay: 0,
      enablejsapi: 1,
      controls: canControl ? 1 : 0,
      disablekb: canControl ? 0 : 1,
      rel: 0,
      modestbranding: 1,
    },
  };

  const handleReady = (event) => {
    if (onReady) {
      onReady(event.target);
    }
  };

  return (
    <div 
      className="player-wrapper" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '450px',
        cursor: canControl ? 'default' : 'not-allowed'
      }}
    >
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={onStateChange}
      />

      {/* Click Shield ONLY covers Participants (Host and Moderator pass through cleanly) */}
      {!canControl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            cursor: 'not-allowed',
            background: 'rgba(0, 0, 0, 0.001)',
            pointerEvents: 'all',
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          title="Playback controls are restricted to Host and Moderator"
        />
      )}
    </div>
  );
};

export default YouTubePlayer;