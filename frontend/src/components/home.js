import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import './css/home.css';
import img1 from './img/img1.png';
import logo from './img/logo.jpg';

const Home = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load external CSS
    const loadCSS = (url) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    };
    
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick.min.css');
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.9.0/slick-theme.min.css');
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
  }, []);
  
  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
    pauseOnHover: true,
  };
  
  const navigateToLiveStream = () => {
    navigate('/live-stream');
  };
  
  const navigateToVideo = (videoId) => {
    navigate(`/video/${videoId}`);
  };
  
  // Featured videos for slider
  const featuredVideos = [
    { id: 1, title: "Ultimate Gaming Setup Tour 2025", description: "Check out the latest gaming gear and setup", image: img1 },
    { id: 2, title: "Pro Tips: Mastering Battle Royale Games", description: "Learn from the champions and improve your skills", image: img1 },
    { id: 3, title: "How I Built My Streaming Career", description: "The journey from zero to pro streamer", image: img1 }
  ];
  
  // Video categories
  const videoCategories = [
    "Recommended"
  ];
  
  return (
    <div>
      {/* Header */}
      <header id="header">
        <div className="logo-container">
          <img src={logo} alt="StreamSync Logo" className="logo" />
          <h1 className="app-name">StreamSync</h1>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="Search videos, channels, or categories..." />
        </div>
        <img src="https://via.placeholder.com/150" alt="Profile" className="profile-image" />
      </header>
      
      {/* Featured Slider */}
      <div id="containerSlider">
        <Slider {...settings}>
          {featuredVideos.map((video) => (
            <div key={video.id} onClick={() => navigateToVideo(video.id)}>
              <img src={video.image} alt={video.title} />
              <div className="slider-caption">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>
      
      {/* Categories */}
      {videoCategories.map((category, index) => (
        <div key={index}>
          <h2 className="section-title">{category}</h2>
          <div className="cards-container">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="card" onClick={() => navigateToVideo(`${category.toLowerCase()}-${id}`)}>
                <img src={img1} alt={`Video ${id}`} />
                <span className="duration">10:45</span>
                <div className="card-content">
                  <p>{category}: Amazing Video {id}</p>
                  <span className="views">
                    <i className="fas fa-eye" style={{ marginRight: '5px' }}></i>
                    {Math.floor(Math.random() * 500) + 100}K views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Live Stream Button */}
      <button className="live-stream-button" onClick={navigateToLiveStream}>
        <span className="live-icon"></span>
        Go Live
      </button>
      
      {/* Footer */}
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
};

export default Home;