import './loadEnv.js'
import express from 'express';
import cors from 'cors';
import TranscriptsRoute from './controllers/transcripts/index.js'
import ScriptsRoute from './controllers/scripts/index.js'

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

app.use(express.json({ limit: '50mb' }));

app.use('/api', TranscriptsRoute);

app.use('/api', ScriptsRoute);

app.get('/status', (req, res) => {
    res.send('Server is up now.');
});

app.listen(port, () => console.log('Server is running'));
