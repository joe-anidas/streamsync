import React from 'react';
import { useNavigate } from 'react-router-dom';
import img1 from "./img/img1.png";
import img2 from "./img/img2.png";
import img3 from "./img/img3.png";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './css/videogallery.css';

const SliderContainer = () => {
    const navigate = useNavigate();

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
        { 
            id: 1, 
            title: "Tech Review 2025", 
            description: "Latest gadgets and tech insights", 
            image: img1, 
            streamUrl: "https://d3lpmfgs2gc4xs.cloudfront.net/streams/master.m3u8" 
        },
        { 
            id: 2, 
            title: "Epic Travel Vlog", 
            description: "Explore breathtaking destinations", 
            image: img2, 
            streamUrl: "https://d3lpmfgs2gc4xs.cloudfront.net/streams/master.m3u8" 
        },
        { 
            id: 3, 
            title: "Mastering Web Development", 
            description: "Essential tips for developers", 
            image: img3, 
            streamUrl: "https://d3lpmfgs2gc4xs.cloudfront.net/streams/master.m3u8" 
        }
    ];

    const handleNavigate = (streamUrl) => {
        navigate('/live-stream', { state: { streamUrl } });
    };

    return (
        <div className="slider-container">
            <Slider {...sliderSettings}>
                {featuredVideos.map((video) => (
                    <div 
                        key={video.id} 
                        className="slider-item" 
                        onClick={() => handleNavigate(video.streamUrl)}
                    >
                        <img src={video.image} alt={video.title} className="slider-image" />
                        <div className="slider-caption">
                            <h3>{video.title}</h3>
                            <p>{video.description}</p>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default SliderContainer;