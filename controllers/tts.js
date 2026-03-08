// @desc    Convert text to speech using ElevenLabs API
// @route   POST /api/tts
// @access  Public
exports.generateAudio = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required for TTS' });
        }

        const VOICE_ID = 'JBFqnCBcs6BaYro611Zz'; // George (default, conversational, pleasant)
        const API_KEY = process.env.ELEVENLABS_API_KEY;

        if (!API_KEY) {
             return res.status(500).json({ success: false, error: 'ElevenLabs API key is missing' });
        }

        const options = {
            method: 'POST',
            headers: {
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_turbo_v2_5', // Faster model for real-time applications
                voice_settings: {
                    similarity_boost: 0.7,
                    stability: 0.5
                }
            })
        };

        // Use native fetch API (available in Node 18+)
        const response = await globalThis.fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, options);

        if (!response.ok) {
            const errorData = await response.json();
             console.error('ElevenLabs API Error:', errorData);
            return res.status(response.status).json({ success: false, error: 'Error generating audio' });
        }

        const audioBuffer = await response.arrayBuffer();
        
        // Send back the audio file
        res.set('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));

    } catch (err) {
        console.error('TTS Error:', err);
        res.status(500).json({ success: false, error: 'Server Error generating audio' });
    }
};
