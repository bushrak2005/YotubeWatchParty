import YouTube from "react-youtube";

function YouTubePlayer({ videoId }) {
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
    />
  );
}

export default YouTubePlayer;