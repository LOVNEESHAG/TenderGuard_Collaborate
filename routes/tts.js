const express = require('express');
const { generateAudio } = require('../controllers/tts');

const router = express.Router();

router.post('/', generateAudio);

module.exports = router;
