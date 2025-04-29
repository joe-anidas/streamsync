# STREAMSYNCJJ - AURAFLIX  
**Secure & Synchronized Live Streaming for All**

---

## 🔍 What Problem It Solves  
**StreamSyncJJ - Auraflix** ensures all viewers experience live streams in perfect sync, eliminating delays and desynchronization. It’s built for secure, scalable streaming—ideal for events, webinars, and interactive sessions with real-time chat and HLS encryption.

---

## 💡 Key Features  
- 🔒 Encrypted video streaming with secure playback  
- 🔄 Real-time viewer synchronization via WebSockets  
- 💬 Interactive live chat for audience engagement  
- ⚙️ Scalable architecture with AWS S3 + CloudFront  
- 📺 HLS with FFmpeg for segmented streaming  
- 📦 Modular full-stack MERN setup  

---

## 🛠️ Tech Stack  
- **Frontend:** React, Video.js  
- **Backend:** Node.js, Express, WebSockets, FFmpeg  
- **Database:** MongoDB  
- **Streaming:** HLS (HTTP Live Streaming)  
- **Storage/CDN:** AWS S3, CloudFront  

---

## 📁 Project Structure

```bash
StreamSyncJJ-Auraflix/
├── backend/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
├── vercel.json
├── .gitignore
└── README.md
```

---

## 📈 Challenges Faced  
- **Sync drift:** Fixed HLS segment timing and WebSocket event handling.  
- **Scalable encrypted storage:** Solved via AWS S3 + CloudFront integration.

---

## 🔗 Deployment  
- Backend hosted on **Render**  
- Frontend deployed on **Vercel**

---
