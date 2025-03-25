import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;

// Create HTTP server for Express + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================== CORS Configuration ==================
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://streamsync-puce.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// ================== Middleware ==================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
const sessionParser = session({
  secret: process.env.SESSION_SECRET || "default_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS in production
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

// ================== MongoDB Connection ==================
mongoose
  .connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// ================== User Model ==================
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// ================== Passport Strategies ==================
// Local Strategy (Email/Password)
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

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`, // Use BACKEND_URL dynamically
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

// Serialize/Deserialize User
passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser(async (email, done) => {
  try {
    const user = await User.findOne({ email });
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// ================== Routes ==================
// Register
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

// Login
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

// Logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ message: "Logout successful" });
  });
});

// Dashboard (Protected Route)
app.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  res.json({ email: req.user.email });
});

// Google OAuth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    console.log("✅ Google OAuth Callback Successful");
    console.log("Redirecting to:", `${process.env.FRONTEND_URL}/dashboard`);
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// ================== WebSocket Server ==================
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

// ================== Start Server ==================
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
