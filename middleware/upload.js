const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + Math.floor(Math.random() * 1000) + path.extname(file.originalname));
    }
});

// Initial upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
});

module.exports = upload;
