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
import MongoStore from "connect-mongo";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
const isProduction = process.env.NODE_ENV === "production";

// Create HTTP server for Express + WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================== Database Connection ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// ================== Session Store ==================
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions",
  ttl: 24 * 60 * 60, // 1 day
});

// ================== CORS Configuration ==================
const corsOptions = {
  origin: isProduction 
    ? [process.env.FRONTEND_URL, "https://streamsync-puce.vercel.app"] 
    : "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ================== Middleware ==================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
const sessionParser = session({
  secret: process.env.SESSION_SECRET || "default_session_secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    domain: isProduction ? new URL(process.env.FRONTEND_URL).hostname : undefined,
  },
});

app.use(sessionParser);
app.use(passport.initialize());
app.use(passport.session());

// ================== User Model ==================
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ================== Passport Configuration ==================
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) return done(null, false, { message: "Incorrect email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return done(null, false, { message: "Incorrect email or password" });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ 
          $or: [
            { email: profile.email },
            { googleId: profile.id }
          ]
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash(profile.id, saltRounds);
          user = await User.create({ 
            email: profile.email, 
            password: hashedPassword,
            googleId: profile.id
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// ================== Routes ==================
// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({ email, password: hash });

    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).json({ error: "Login after registration failed" });
      }
      res.status(201).json({ 
        message: "Registration successful",
        user: { email: newUser.email, id: newUser._id }
      });
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Authentication error" });
    if (!user) return res.status(401).json({ error: info.message || "Invalid credentials" });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: "Session creation failed" });
      res.json({ 
        message: "Login successful",
        user: { email: user.email, id: user._id }
      });
    });
  })(req, res, next);
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    
    res.clearCookie("connect.sid", {
      path: "/",
      domain: isProduction ? new URL(process.env.FRONTEND_URL).hostname : undefined,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    
    res.json({ message: "Logout successful" });
  });
});

app.get("/session", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ 
      authenticated: true, 
      user: { email: req.user.email, id: req.user._id } 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Protected Routes
app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ 
    email: req.user.email,
    id: req.user._id
  });
});

// OAuth Routes
app.get("/auth/google", passport.authenticate("google", { 
  scope: ["profile", "email"],
  prompt: "select_account"
}));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` 
  }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// ================== WebSocket Server ==================
wss.on("connection", (ws, req) => {
  sessionParser(req, {}, () => {
    if (!req.session.passport?.user) {
      ws.close(1008, "Unauthorized");
      return;
    }

    console.log("🔗 New authenticated WebSocket connection");

    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        
        // Verify user is still authenticated
        const user = await User.findById(req.session.passport.user);
        if (!user) {
          ws.close(1008, "User not found");
          return;
        }

        // Broadcast chat messages
        if (data.type === "chat") {
          const messageData = {
            type: "chat",
            userId: user._id,
            email: user.email,
            message: data.message,
            timestamp: new Date().toISOString(),
          };

          // Broadcast to all connected clients
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === ws.OPEN) {
              client.send(JSON.stringify(messageData));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
    });
  });
});

// ================== Error Handling ==================
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ================== Start Server ==================
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🛡️ CORS configured for: ${corsOptions.origin}`);
  console.log(`🔐 Secure cookies: ${isProduction}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});
