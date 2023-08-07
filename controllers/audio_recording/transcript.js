import fs from 'fs';
import path from 'path';
import deepgramSdk from '@deepgram/sdk';
import supabase from '../../db/supabase.js'
import { storage_path, checkFileExists } from '../../utils/storage.js';
// TODO: create singleton for env variables
import dotenv from 'dotenv';
dotenv.config();

const { Deepgram } = deepgramSdk
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

const getTranscript = async (req, res) => {
    const file_name = req.body.file_name;
    const mimetype = req.body.mimetype;
    if (!file_name || !mimetype) {
        res.status(400);
        return res.end();
    }
    const filePath = path.join(storage_path, file_name);
    try {
        await checkFileExists(filePath);
    } catch (err) {
        res.status(400);
        return res.end();
    }

    const audioRecordingStream = fs.createReadStream(filePath);
    try {
        const deepgram = new Deepgram(deepgramApiKey);
        const response = await deepgram.transcription.preRecorded({
            stream: audioRecordingStream,
            mimetype: mimetype,
        }, {
            smart_format: true,
            punctuate: true,
            paragraphs: true,
            diarize: true,
            model: 'phonecall',
            tier: 'nova',
        });

        const audioRecordingStreamForStorage = fs.createReadStream(filePath);
        supabase
            .storage
            .from('audio-recordings')
            .upload(`mag-gen/${file_name}`, audioRecordingStreamForStorage, {
                cacheControl: '3600',
                upsert: false, duplex: 'half'
            })
            .then(() => console.log(`saved to supabase - ${filePath}`))
            .catch(err => console.log(err))
            .then(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.log(`can't delete - ${filePath}`)
                    else console.log(`deleted - ${filePath}`)
                });
            })

        return res.json({ transcript: response.results.channels[0].alternatives[0].transcript })
    } catch (err) {
        console.error(err);
        return res.status(500)
    }
}

export default getTranscript;
