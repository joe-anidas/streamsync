import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './css/videogallery.css';
import img1 from "./img/img1.png";
import img2 from "./img/img2.png";
import img3 from "./img/img3.png";
import img4 from "./img/img4.png";
import SliderContainer from "./SliderContainer";

const VideoGallery = () => {
  const navigate = useNavigate();
  const videoCategories = ["Recommended"];
  const images = [img1, img2, img3, img4];
  const videoUrls = [
    "https://d3lpmfgs2gc4xs.cloudfront.net/pastlives.mp4",
    "https://d3lpmfgs2gc4xs.cloudfront.net/animation.mp4",
    "https://d3lpmfgs2gc4xs.cloudfront.net/flow.mp4",
    "https://d3lpmfgs2gc4xs.cloudfront.net/marvel.mp4"
  ];

  const handleCardClick = (url) => {
    navigate('/video-player', { state: { videoUrl: url } });
  };

  return (
    <div className="video-gallery">
      {/* Featured Videos Slider */}
      <SliderContainer />

      {/* Video Categories */}
      {videoCategories.map((category, index) => (
        <div key={index} className="category-section">
          <h2 className="section-title">{category}</h2>
          <div className="cards-container">
            {images.map((image, id) => (
              <div 
                key={id} 
                className="card" 
                onClick={() => handleCardClick(videoUrls[id])}
              >
                <img src={image} alt={`Video ${id + 1}`} className="card-image" />
                <span className="duration">10:45</span>
                <div className="card-content">
                  <p>{category}: Interesting Video {id + 1}</p>
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
    </div>
  );
};

export default VideoGallery;