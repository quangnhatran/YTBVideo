const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const router = express.Router();
const passport = require('passport');


const USERS_FILE = 'users.json';
let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.render('login', { error: 'Invalid email or password' });
    }
    req.session.user = { username: user.username, email: user.email };
    res.redirect('/');
});

router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    if (users.some(u => u.email === email)) {
        return res.render('register', { error: 'Email already registered' });
    }
    const hashed = bcrypt.hashSync(password, 10);
    const newUser = { username, email, password: hashed };
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    req.session.user = { username, email };
    res.redirect('/');
});

router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect('/login');
    });
});
// Đăng nhập bằng Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Callback từ Google
router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    req.session.user = {
  username: req.user.username,
  email: req.user.email,
  avatar: req.user.avatar
};
req.session.save(() => {
  res.redirect('/');
});
  });
module.exports = router;
