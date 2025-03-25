import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ================== Production Security Middleware ==================
app.set('trust proxy', 1); // Trust first proxy (important for Render.com, Vercel, etc.)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", process.env.FRONTEND_URL, process.env.BACKEND_URL]
    }
  },
  hsts: {
    maxAge: 63072000, // 2 years in seconds
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// ================== Strict CORS Configuration ==================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://streamsync-puce.vercel.app' // Your production frontend URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.endsWith(new URL(allowedOrigin).hostname)
    ) {
      callback(null, true);
    } else {
      console.error('🚨 CORS Violation Attempt from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ================== Session Configuration ==================
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for HTTPS behind proxy
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: 'native'
  }),
  cookie: {
    secure: true, // HTTPS only
    sameSite: 'none', // Required for cross-site cookies
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN // e.g. '.onrender.com'
  }
});

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ================== Database Connection ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: 'majority'
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ================== User Model ==================
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      message: 'Invalid email format'
    }
  },
  password: { 
    type: String, 
    select: false 
  },
  googleId: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ================== Passport Configuration ==================
passport.use(new LocalStrategy({
  usernameField: 'email'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return done(null, false, { message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return done(null, false, { message: 'Invalid credentials' });

    return done(null, user);
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
    if (!profile.emails?.[0]?.value) {
      return done(new Error('No email found in Google profile'));
    }

    let user = await User.findOne({ 
      $or: [
        { email: profile.emails[0].value },
        { googleId: profile.id }
      ]
    });

    if (!user) {
      user = await User.create({
        email: profile.emails[0].value,
        googleId: profile.id,
        password: await bcrypt.hash(profile.id + process.env.SESSION_SECRET, 12)
      });
    } else if (!user.googleId) {
      user.googleId = profile.id;
      await user.save();
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

// ================== Production Routes ==================
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword });

    req.login(user, (err) => {
      if (err) {
        console.error('Login after registration error:', err);
        return res.status(500).json({ error: 'Login failed after registration' });
      }
      return res.status(201).json({ 
        message: 'Registration successful', 
        user: { email: user.email } 
      });
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ... [Keep other routes the same as in your original code] ...

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

// ================== Health Check Endpoint ==================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ================== Start Production Server ==================
server.listen(port, () => {
  console.log(`🚀 Production server running on port ${port}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🔒 Secure cookies: ${process.env.NODE_ENV === 'production'}`);
});
