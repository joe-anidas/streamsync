import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";
import LiveHLSPlayer from "./components/LiveHLSPlayer";
import VideoPlayer from './components/VideoPlayer';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/live-stream" element={<LiveHLSPlayer />} />
        <Route path="/video-player" element={<VideoPlayer />} />
      </Routes>
    </Router>
  );
};

export default App;