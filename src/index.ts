import './loadEnv.js'
import express from 'express';
import cors from 'cors';
import AudioRecordingRoute from './controllers/audio_recording/index.js'
import ScriptRoute from './controllers/script/index.js'

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

app.use(express.json());

app.use('/api/audio_recording', AudioRecordingRoute);

app.use('/api/script', ScriptRoute);

app.get('/status', (req, res) => {
    res.send('Server is up now.');
});

app.listen(port, () => console.log('Server is running'));
