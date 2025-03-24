import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./css/live.css"; // Import the CSS file
import { useLocation } from 'react-router-dom';

const LiveHLSPlayer = () => {
  const location = useLocation();
  const src = location.state?.streamUrl || "";
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isLive, setIsLive] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [isAtLiveEdge, setIsAtLiveEdge] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const wsRef = useRef(null);

  // Connect to WebSocket server
  useEffect(() => {
    const ws = new WebSocket("wss://streamsyncbackend.onrender.com");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "chat") {
        setMessages((prevMessages) => [...prevMessages, data]);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Send chat message
  const sendMessage = () => {
    if (inputMessage.trim() && wsRef.current) {
      const message = {
        type: "chat",
        username: "User", // Replace with actual username if available
        message: inputMessage.trim(),
        timestamp: new Date().toISOString(), // Add a valid timestamp
      };

      wsRef.current.send(JSON.stringify(message));
      setInputMessage("");
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Initialize HLS.js and handle video streaming
  useEffect(() => {
    const video = videoRef.current;

    // Set the scheduled start time (example: 1 AM today)
    const today = new Date();
    today.setHours(1, 35, 0, 0); // 1:00 AM
    const scheduledStartTime = today.getTime();
    setStartTime(scheduledStartTime);

    // Current time
    const now = Date.now();

    // Check if the stream should be live
    if (now < scheduledStartTime) {
      setIsLive(false);
      return; // Don't start streaming yet
    }

    let liveEdgeInterval;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Force live mode with minimal latency
        liveSyncDurationCount: 1,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: true,
        enableWorker: true,
        startLevel: -1,
        // Always start at live edge
        startPosition: -1,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      // Initial load
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        console.log("Manifest parsed, starting at live edge");

        // Calculate the elapsed time since the scheduled start
        const elapsedTime = (now - scheduledStartTime) / 1000; // in seconds

        // Set the initial playback position based on elapsed time
        if (elapsedTime > 0) {
          video.currentTime = elapsedTime;
        }

        video.play().catch((e) => console.error("Auto-play failed:", e));
        setStreamLoaded(true);
        setIsAtLiveEdge(true);
      });

      // This event fires when stream data is loaded
      hls.on(Hls.Events.LEVEL_LOADED, function (event, data) {
        // Check if stream has live segments
        if (data.details.live) {
          setIsLive(true);
          // Force seek to live edge again when level loads
          if (hls.liveSyncPosition) {
            video.currentTime = hls.liveSyncPosition;
            setIsAtLiveEdge(true);
          }
        } else {
          setIsLive(false);
        }
      });

      // Check if we're at live edge
      const checkLiveEdge = () => {
        if (hls.liveSyncPosition && video.currentTime) {
          // We consider the viewer at the live edge if they're within 10 seconds
          const isNearLiveEdge = hls.liveSyncPosition - video.currentTime < 10;
          setIsAtLiveEdge(isNearLiveEdge);
        }
      };

      // Set up interval to periodically check if we're at live edge
      liveEdgeInterval = setInterval(checkLiveEdge, 2000);

      // Also check when user manually seeks
      video.addEventListener("seeked", checkLiveEdge);

      // When playback pauses, we're likely not at live edge
      video.addEventListener("pause", () => {
        setIsAtLiveEdge(false);
      });

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        if (video) {
          video.removeEventListener("seeked", checkLiveEdge);
          video.removeEventListener("pause", () => setIsAtLiveEdge(false));
        }
        clearInterval(liveEdgeInterval);
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari
      video.src = src;

      video.addEventListener("loadedmetadata", () => {
        console.log("Safari: Stream metadata loaded");

        // Calculate the elapsed time since the scheduled start
        const elapsedTime = (now - scheduledStartTime) / 1000; // in seconds

        // Set the initial playback position based on elapsed time
        if (elapsedTime > 0 && video.duration && video.duration !== Infinity) {
          video.currentTime = Math.min(elapsedTime, video.duration - 0.1);
        }

        video.play().catch((e) => console.error("Auto-play failed:", e));
        setStreamLoaded(true);
        setIsAtLiveEdge(true);
      });

      // Safari live edge detection
      const checkSafariLiveEdge = () => {
        if (video.duration > 0 && video.duration !== Infinity) {
          // If we're close to the end, we're at live edge
          setIsAtLiveEdge(video.duration - video.currentTime < 10);
        }
      };

      const safariInterval = setInterval(checkSafariLiveEdge, 2000);

      // When playback pauses, we're likely not at live edge
      video.addEventListener("pause", () => {
        setIsAtLiveEdge(false);
      });

      video.addEventListener("seeked", checkSafariLiveEdge);

      return () => {
        clearInterval(safariInterval);
        video.removeEventListener("seeked", checkSafariLiveEdge);
        video.removeEventListener("pause", () => setIsAtLiveEdge(false));
      };
    }
  }, [src]);

  // Function to jump to live edge
  const jumpToLiveEdge = () => {
    const video = videoRef.current;
    const hls = hlsRef.current;

    if (video && hls && hls.liveSyncPosition) {
      // Use HLS.js's live sync position which is more accurate
      video.currentTime = hls.liveSyncPosition;
      video.play().catch((e) => console.error("Play failed:", e));
      setIsAtLiveEdge(true);
    } else if (video && video.duration && video.duration !== Infinity) {
      // Fallback for Safari or if liveSyncPosition isn't available
      video.currentTime = video.duration - 0.1;
      video.play().catch((e) => console.error("Play failed:", e));
      setIsAtLiveEdge(true);
    }
  };

  // Function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="live-player-container">
      <h2>Live Video Streaming</h2>
      {!isLive && startTime && startTime > Date.now() ? (
        <div className="scheduled-message">
          <p>Stream scheduled to start at {formatTime(startTime)}</p>
          <p>Please return later</p>
        </div>
      ) : (
        <>
          <div className="video-wrapper">
            <video ref={videoRef} controls width="640" height="360"></video>
            {isLive && (
              <div
                className={`live-indicator ${
                  isAtLiveEdge ? "" : "behind-live"
                }`}
              >
                {isAtLiveEdge ? "LIVE" : "BEHIND LIVE"}
              </div>
            )}
          </div>
          {streamLoaded && isLive && !isAtLiveEdge && (
            <button
              onClick={jumpToLiveEdge}
              className="jump-to-live-button"
            >
              Jump to Live Edge
            </button>
          )}

          {/* Chat Box */}
          <div className="chat-box">
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <strong>{msg.username}:</strong> {msg.message}
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveHLSPlayer;
