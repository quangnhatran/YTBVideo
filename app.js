require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const app = express();
const PORT = 3000;

// 🔧 Tạo thư mục sessions nếu chưa tồn tại
const sessionsPath = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsPath)) {
  fs.mkdirSync(sessionsPath);
}

// 📦 Cấu hình view engine + middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 🗂️ Cấu hình session lưu file
app.use(session({
  secret: 'secret-key',
  store: new FileStore({
    path: sessionsPath,
    ttl: 86400,
    retries: 1
  }),
  resave: false,
  saveUninitialized: false
}));

// 🔑 Tích hợp Passport (Google login)
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://ytbvideo-2.onrender.com/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    username: profile.displayName,
    email: profile.emails[0].value,
    avatar: profile.photos[0].value   // 👈 lấy hình avatar
  };
  return done(null, user);
}));

// 📌 Routing
app.use(authRoutes);
app.use('/', videoRoutes);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running at: http://localhost:${PORT}`);
});
