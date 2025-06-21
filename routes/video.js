const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const DATA_PATH = 'videos.json';

let videos = [];
if (fs.existsSync(DATA_PATH)) {
    videos = JSON.parse(fs.readFileSync(DATA_PATH));
}

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Route: Trang chủ - Danh sách video
router.get('/', (req, res) => {
    const query = req.query.q;
    let filteredVideos = videos;

    if (query) {
        const lowerQuery = query.toLowerCase();
        filteredVideos = videos.filter(v =>
            v.title.toLowerCase().includes(lowerQuery) ||
            v.description.toLowerCase().includes(lowerQuery)
        );
    }

    res.render('index', {
        videos: filteredVideos,
        user: req.session.user
    });
});


// Route: Trang upload (chặn nếu chưa đăng nhập)
router.get('/upload', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('upload', {
        user: req.session.user
    });
});

// Route: Upload video (chặn nếu chưa đăng nhập)
router.post('/upload', upload.single('video'), (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const { title, description } = req.body;
    const newVideo = {
        title,
        description,
        filename: req.file.filename
    };
    videos.push(newVideo);

    fs.writeFileSync(DATA_PATH, JSON.stringify(videos, null, 2));
    res.redirect('/');
});
const COMMENTS_FILE = 'comments.json';
let comments = fs.existsSync(COMMENTS_FILE) ? JSON.parse(fs.readFileSync(COMMENTS_FILE)) : [];

// Trang xem video
router.get('/watch/:filename', (req, res) => {
    const video = videos.find(v => v.filename === req.params.filename);
    if (!video) return res.status(404).send("Video not found");

    const otherVideos = videos.filter(v => v.filename !== req.params.filename);
    const videoComments = comments.filter(c => c.video === video.filename);

    res.render('watch', { video, otherVideos, videoComments, user: req.session.user });
});

// Gửi bình luận
router.post('/comment/:filename', express.json(), (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Chưa đăng nhập' });

    const { comment } = req.body;
    const newComment = {
        video: req.params.filename,
        username: req.session.user.username,
        comment,
        time: new Date().toISOString()
    };
    comments.push(newComment);
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
    res.json(newComment); // 👈 trả về JSON cho frontend xử lý
});



module.exports = router;
