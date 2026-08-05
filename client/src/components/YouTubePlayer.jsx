import YouTube from "react-youtube";

function YouTubePlayer({
  videoId,
  onReady,
  onStateChange,
}) {
  const options = {
    width: "900",
    height: "500",
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <YouTube
      videoId={videoId}
      opts={options}
      onReady={onReady}
      onStateChange={onStateChange}
    />
  );
}

export default YouTubePlayer;