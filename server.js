import { transcribeDiarizedAudio } from './utils/deepgram-transcribe.js';
import { removeScriptMistakes } from './utils/removeMistakes.js';
import { completePrompt } from './utils/generate-script.js';
import { upload } from './utils/storage.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Only allow requests from the specific frontend. If none specified, allow all
// app.use(
//     cors({
//         origin: process.env.ALLOWED_ORIGIN || '*',
//     })
// );

// Allow requests from all origins
app.use(cors());

app.use(express.json());

app.get('/status', (req, res) => {
    res.send('Server is up now.');
});

app.post('/api/upload_record', upload.single('record'), (req, res) => {
    res.json({
        file_name: req.file.filename,
        mimetype: req.file.mimetype,
    });
});

app.post('/api/get_transcript', async (req, res) => {
    // PASS IN FILE NAME - SEND BACK DIARIZED AUDIO
    console.log(req.file_name);
    res.send(await transcribeDiarizedAudio(req.body.file_name));
});

app.post('/api/remove_mistakes', async (req, res) => {
    // PASS IN FILE NAME - SEND BACK DIARIZED AUDIO
    console.log(req.file_name);
    res.send(await removeScriptMistakes(req.body.file_name));
});

app.get('/api/get_script', (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    console.log('Client connected to SSE');

    // PASS IN FILE NAME + OPTIONAL MODIFIERS
    // STREAM THE RESPONSE FROM OPENAI
    completePrompt(
        req.query.fileName, // The file name of the transcript to inject into the prompt
        req.query.setOrCloseCall || 'close', // Use either a 'set' or 'close' prompt based on the type of script is needed
        req.query.generateSingleSpeakerFiles || true, // Generate (or re-write) the single-speaker transcripts for fileName
        req.query.useSingleSpeakerText || true, // Inject into the prompt the single-speaker transcript instead of the orginal
        req.query.useContinue || true, // Should the prompt be a chain of 'continue:' calls, or a single big prompt?
        (data) => res.write(`data: ${JSON.stringify(data)}\n\n`), // Send data to client
        () => res.end() // End the response
    ).catch((error) => console.log(error));
});

app.listen(port, () => console.log('Server is running'));
