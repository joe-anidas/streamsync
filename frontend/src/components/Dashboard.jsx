import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "./img/logo.jpg";
import "./css/dashboard.css";
import VideoGallery from "./VideoGallery";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("http://localhost:3000/dashboard", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.error) {
        alert("Unauthorized! Redirecting to login...");
        navigate("/login");
      } else {
        setUserEmail(data.email);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    const res = await fetch("http://localhost:3000/logout", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    if (data.message) {
      alert("Logged out successfully!");
      navigate("/");
    } else {
      alert("Logout failed!");
    }
  };

  useEffect(() => {
    const loadCSS = (url) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    };

    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css");
    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css");
    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");
  }, []);

  const navigateToVideo = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const navigateToLiveStream = () => {
    navigate('/live-stream');
  };

 // ...existing code...
 return (
  <div>
    <header id="header">
      <div className="logo-container">
        <img src={logo} alt="StreamSync Logo" className="logo" />
        <h1 className="app-name">StreamSync</h1>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Search videos, channels, or categories..." />
      </div>
      <div className="profile-container">
        <span className="profile-name">{userEmail}</span>
      </div>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </header>
    <br></br><br></br><br></br><br></br><br></br><br></br>
    <VideoGallery />
    <button className="live-stream-button" onClick={navigateToLiveStream}>
      <span className="live-icon"></span>
      Go Live
    </button>

    <footer id="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </div>
      <div className="copyright">
        © 2025 StreamSync. All rights reserved.
      </div>
    </footer>
  </div>
);
// ...existing code...
}

export default Dashboard;