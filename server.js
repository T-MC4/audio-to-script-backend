import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import audio_recording_route from './controllers/audio_recording/index.js'
import script_route from './controllers/script/index.js'
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Only allow requests from the specific frontend. If none specified, allow all
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGIN || '*',
    })
);

app.use(express.json());

app.use('/api/audio_recording', audio_recording_route);

app.use('/api/script', script_route)

app.get('/status', (req, res) => {
    res.send('Server is up now.');
});

app.listen(port, () => console.log('Server is running'));
