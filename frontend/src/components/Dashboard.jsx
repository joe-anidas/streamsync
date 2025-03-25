import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./img/logo.jpg";
import "./css/dashboard.css";
import VideoGallery from "./VideoGallery";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load external CSS
    const loadCSS = (url) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
    };

    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css");
    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css");
    loadCSS("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css");

    // Check session status
    const checkSession = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/session`, {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error("Session check failed");

        const data = await res.json();
        
        if (data.authenticated) {
          setUserEmail(data.user.email);
        } else {
          navigate("/login", { replace: true });
        }
      } catch (err) {
        setError("Failed to verify session. Please try again.");
        console.error("Session check error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/logout`, {
        method: "POST", // Changed to POST for better semantics
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error("Logout failed");

      const data = await res.json();
      if (data.message) {
        navigate("/login", { replace: true });
      }
    } catch (err) {
      setError("Logout failed. Please try again.");
      console.error("Logout error:", err);
    }
  };

  const navigateToVideo = (videoId) => {
    navigate(`/video/${videoId}`);
  };

  const navigateToLiveStream = () => {
    navigate('/live-stream');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header id="header">
        <div className="logo-container">
          <img src={logo} alt="StreamSync Logo" className="logo" />
          <h1 className="app-name">StreamSync</h1>
        </div>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search videos, channels, or categories..." 
            className="search-input"
          />
          <i className="fas fa-search search-icon"></i>
        </div>
        <div className="user-controls">
          <div className="profile-container">
            <span className="profile-name">{userEmail}</span>
            <i className="fas fa-user-circle profile-icon"></i>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            aria-label="Logout"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <VideoGallery navigateToVideo={navigateToVideo} />
        
        <button 
          className="live-stream-button" 
          onClick={navigateToLiveStream}
        >
          <span className="live-icon">
            <i className="fas fa-broadcast-tower"></i>
          </span>
          Go Live
        </button>
      </main>

      <footer id="footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <div className="social-links">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} StreamSync. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
