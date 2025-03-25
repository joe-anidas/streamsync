import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./img/logo.jpg";
import "./css/dashboard.css";
import VideoGallery from "./VideoGallery";

const Dashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Memoized session verification
  const verifySession = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const url = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/session?t=${Date.now()}`;
      
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (res.status === 401) {
        throw new Error("Your session has expired. Please login again.");
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.authenticated) {
        navigate("/login", { 
          state: { 
            from: "dashboard",
            reason: "session-expired"
          }, 
          replace: true 
        });
        return;
      }

      setUserEmail(data.user.email);
    } catch (err) {
      setError(err.message);
      console.error("Session verification failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Load external CSS in production only
    if (process.env.NODE_ENV === "production") {
      const links = [
        "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css",
        "https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css",
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      ];

      links.forEach(url => {
        if (!document.querySelector(`link[href="${url}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = url;
          document.head.appendChild(link);
        }
      });
    }

    verifySession();
  }, [verifySession]);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Always clear client-side state
      setUserEmail("");
      setError(null);
      
      if (!res.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      navigate("/login", { 
        state: { 
          from: "dashboard",
          reason: "user-initiated"
        },
        replace: true 
      });
    } catch (err) {
      setError(err.message);
      console.error("Logout error:", err);
      // Force logout if there's an error
      navigate("/login", { replace: true });
    }
  };

  const handleRetry = () => {
    verifySession();
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
          onClick={handleRetry}
        >
          Retry
        </button>
        <button 
          className="logout-button"
          onClick={handleLogout}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Rest of your JSX remains the same */}
    </div>
  );
};

export default Dashboard;
