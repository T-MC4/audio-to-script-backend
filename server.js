import { transcribeDiarizedAudio } from './utils/deepgram-transcribe.js';
import { completePrompt } from './utils/generate-script.js';
import { upload } from './utils/storage.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();

dotenv.config();
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
    res.send(await transcribeDiarizedAudio(req.body.file_name));
});

app.post('/api/get_script', async (req, res) => {
    // PASS IN FILE NAME + OPTIONAL MODIFIERS
    const {
        fileName, // STRING
        setOrCloseCall, // STRING
        generateSingleSpeakerFiles, // BOOLEAN
        useSingleSpeakerText, // BOOLEAN
        useContinue, // BOOLEAN
    } = req.body;

    // SEND SCRIPT BACK
    res.send(
        // CREATE A SCRIPT
        await completePrompt(
            fileName, // The file name of the transcript to inject into the prompt
            setOrCloseCall || 'close', // Use either a 'set' or 'close' prompt based on the type of script is needed
            generateSingleSpeakerFiles || true, // Generate (or re-write) the single-speaker transcripts for fileName
            useSingleSpeakerText || true, // Inject into the prompt the single-speaker transcript instead of the orginal
            useContinue || true, // Should the prompt be a chain of 'continue:' calls, or a single big prompt?
            (data) => res.write(data), // Callback to send data back to client
            () => res.end() // Callback to end the response
        )
    );
});

// app.post('/api/get_reformatted_script', async (req, res) => {
//     const prompt =
//         'Write summary of following conversation:\n' + req.body.transcript;
//     const reformattedScript = await openai.complete({
//         engine: 'gpt-4-32k-0613',
//         prompt,
//         max_tokens: 2048,
//     });
//     res.send(reformattedScript.choices[0].text);
// });

app.listen(3000, () => console.log('Server is running'));
