import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================== CORS Configuration ==================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ================== Middleware ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for HTTPS behind proxy
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
  }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ================== Database Connection ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ================== User Model ==================
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// ================== Passport Configuration ==================
passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return done(null, false, { message: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? done(null, user) : done(null, false, { message: 'Invalid password' });
  } catch (err) {
    return done(err);
  }
}));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
  scope: ['profile', 'email'],
  state: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      const hashedPassword = await bcrypt.hash(profile.id, 10);
      user = await User.create({
        email: profile.emails[0].value,
        password: hashedPassword
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ================== Routes ==================
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed after registration' });
      return res.json({ message: 'Registration successful', user: { email: user.email } });
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ error: 'Authentication failed' });
    if (!user) return res.status(401).json({ error: info.message || 'Invalid credentials' });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ error: 'Login failed' });
      return res.json({ message: 'Login successful', user: { email: user.email } });
    });
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    // Clear session cookie
    res.clearCookie('connect.sid', {
      domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined,
      path: '/'
    });
    res.json({ message: 'Logout successful' });
  });
});

app.get('/auth/google', passport.authenticate('google', {
  prompt: 'select_account'
}));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    successRedirect: `${process.env.FRONTEND_URL}/dashboard`
  })
);

app.get('/user', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ email: req.user.email });
});

// ================== WebSocket Server ==================
wss.on('connection', (ws, req) => {
  sessionMiddleware(req, {}, () => {
    if (!req.session.passport?.user) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    console.log('🔗 New WebSocket connection from:', req.session.passport.user);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === ws.OPEN) {
            client.send(JSON.stringify({
              type: 'chat',
              user: req.user.email,
              message: data.message,
              timestamp: new Date().toISOString()
            }));
          }
        });
      } catch (err) {
        console.error('❌ WebSocket error:', err);
      }
    });

    ws.on('close', () => console.log('❌ WebSocket disconnected'));
  });
});

// ================== Error Handling ==================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ================== Start Server ==================
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 WebSocket server ready`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
});
