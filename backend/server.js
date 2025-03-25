import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Create an HTTP server for Express and WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL, 
    methods: ["GET", "POST"],
    credentials: true, 
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Express session setup with MongoDB store
const sessionParser = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI, 
    collectionName: "sessions",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production", 
    httpOnly: true,
    sameSite: "none",
  },
});

app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

// User Schema & Model
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Passport Local Strategy
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

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
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

passport.serializeUser((user, done) => done(null, user.email));
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

      req.session.save(() => { // 🔥 Force session save
        console.log("💾 Session saved after registration:", req.session);
        res.json({ message: "Registration successful", user: newUser.email });
      });
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

      req.session.save(() => { // 🔥 Force session save
        console.log("💾 Session saved after login:", req.session);
        res.json({ message: "Login successful", user: user.email });
      });
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
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// WebSocket Connection
wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📩 Message received:", data);

      if (data.type === "chat") {
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) {
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
      console.error("❌ Invalid WebSocket message:", error);
    }
  });

  ws.on("close", () => console.log("❌ WebSocket client disconnected"));
});

// Session Debugging Route
app.get("/session", (req, res) => {
  res.json({ session: req.session, user: req.user });
});

// Start the server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 WebSocket server running on wss://${new URL(process.env.BACKEND_URL).hostname}`);
});
