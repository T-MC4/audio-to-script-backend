import fs from 'fs';
import path from 'path';
import deepgramSdk from '@deepgram/sdk';
import { storage_path } from '../../utils/storage.js';
// TODO: create singleton for env variables
import dotenv from 'dotenv';
dotenv.config();

const { Deepgram } = deepgramSdk
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

const getTranscript = async (req, res) => {
    const file_name = req.body.file_name;
    const mimetype = req.body.mimetype;
    if (!file_name || !mimetype) { res.status(400); res.end(); }
    const filePath = path.join(storage_path, file_name);
    const audioRecordingStream = fs.createReadStream(filePath);
    try {
        const deepgram = new Deepgram(deepgramApiKey);
        const response = await deepgram.transcription.preRecorded({
            stream: audioRecordingStream,
            mimetype: mimetype,
        }, {
            utterances: true,
            model: 'phonecall',
            tier: 'nova',
            multichannel: true,
            diarize: true,
            punctuate: true,
        });
        // TODO: save the file into DB
        fs.unlink(filePath, (err) => {
            if (err) console.log(`can't delete - ${filePath}`)
            else console.log(`deleted - ${filePath}`)
        });
        return res.json({ transcript: response.results.channels[0].alternatives[0].transcript })
    } catch (err) {
        console.error(err);
        return res.status(500)
    }
}

export default getTranscript;
