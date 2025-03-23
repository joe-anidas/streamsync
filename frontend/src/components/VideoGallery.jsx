import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './css/videogallery.css';
import img1 from "./img/img1.png";

const VideoGallery = ({ navigateToVideo }) => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    pauseOnHover: true,
  };

  const featuredVideos = [
    { id: 1, title: "Tech Review 2025", description: "Latest gadgets and tech insights", image: img1 },
    { id: 2, title: "Epic Travel Vlog", description: "Explore breathtaking destinations", image: img1 },
    { id: 3, title: "Mastering Web Development", description: "Essential tips for developers", image: img1 }
  ];

  const videoCategories = [
    "Recommended"
  ];

  return (
    <div className="video-gallery">
      {/* Featured Videos Slider */}
      <div className="slider-container">
        <Slider {...sliderSettings}>
          {featuredVideos.map((video) => (
            <div key={video.id} className="slider-item" onClick={() => navigateToVideo(video.id)}>
              <img src={video.image} alt={video.title} className="slider-image" />
              <div className="slider-caption">
                <h3>{video.title}</h3>
                <p>{video.description}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Video Categories */}
      {videoCategories.map((category, index) => (
        <div key={index} className="category-section">
          <h2 className="section-title">{category}</h2>
          <div className="cards-container">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="card" onClick={() => navigateToVideo(`${category.toLowerCase()}-${id}`)}>
                <img src={img1} alt={`Video ${id}`} className="card-image" />
                <span className="duration">10:45</span>
                <div className="card-content">
                  <p>{category}: Interesting Video {id}</p>
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