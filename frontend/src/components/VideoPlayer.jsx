import React from 'react';
import { useLocation } from 'react-router-dom';

const VideoPlayer = () => {
  const location = useLocation();
  const { videoUrl } = location.state || { videoUrl: '' };

  console.log('Video URL:', videoUrl); // Debugging: Check the video URL

  return (
    <div className="video-player">
      <h1>Video Player</h1>
      <video controls autoPlay>
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;