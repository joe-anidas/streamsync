import React from 'react';
import { useNavigate } from 'react-router-dom';
import img1 from "./img/img1.png";
import img2 from "./img/img2.jpeg";
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
            image: img1, 
            streamUrl: "https://d3lpmfgs2gc4xs.cloudfront.net/streams/master.m3u8" 
        },
        { 
            id: 2, 
            title: "Epic Travel Vlog", 
            image: img2, 
            streamUrl: "https://d3lpmfgs2gc4xs.cloudfront.net/streams/master.m3u8" 
        },
    ];

    const handleNavigate = (streamUrl) => {
        navigate('/live-stream', { state: { streamUrl } });
    };

    return (
        <div style={{ width: '80%', margin: 'auto', position: 'relative' }}>
            <Slider {...sliderSettings}>
                {featuredVideos.map((video) => (
                    <div 
                        key={video.id} 
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => handleNavigate(video.streamUrl)}
                    >
                        <img 
                            src={video.image} 
                            alt={video.title} 
                            style={{ width: '100%', borderRadius: '10px' }} 
                        />
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default SliderContainer;
