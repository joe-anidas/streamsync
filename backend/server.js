import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws"; // Import WebSocketServer & WebSocket
import http from "http"; // Import http module

env.config();

const app = express();
const port = 3000;
const wsPort = 8080; // WebSocket runs on port 8080
const saltRounds = 10;
const wss = new WebSocketServer({ port: wsPort });

// Enable CORS for frontend requests
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const sessionParser = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

// Passport local authentication
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ email: username });
      if (!user) return done(null, false, { message: "User not found" });

      const valid = await bcrypt.compare(password, user.password);
      return valid ? done(null, user) : done(null, false, { message: "Incorrect password" });
    } catch (err) {
      return done(err);
    }
  })
);

// Passport Google authentication
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.email });
        if (!user) {
          const hashedPassword = await bcrypt.hash("google", saltRounds);
          user = await User.create({ email: profile.email, password: hashedPassword });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email });
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// Routes
app.post("/register", async (req, res) => {
  const { username: email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({ email, password: hash });
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: "Login after registration failed" });
      res.json({ message: "Registration successful" });
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (!user) return res.status(401).json({ error: info.message || "Invalid credentials" });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ message: "Login successful" });
    });
  })(req, res, next);
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ message: "Logout successful" });
  });
});

app.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  res.json({ email: req.user.email });
});

// Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("http://localhost:5173/dashboard");
  }
);

// Start Express server
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});


wss.on("connection", (ws, req) => {
  console.log("New WebSocket client connected");

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Handle chat messages
      if (data.type === "chat") {
        console.log(`Chat message from ${data.username}: ${data.message}`);

        // Broadcast the chat message to all connected clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "chat",
                username: data.username,
                message: data.message,
                timestamp: new Date().toISOString(),
              })
            );
          }
        });
      }
    } catch (error) {
      console.error("Invalid WebSocket message received:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

// WebSocket Heartbeat (Prevents Unexpected Disconnections)
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

console.log(`WebSocket server is running on ws://localhost:${wsPort}`);