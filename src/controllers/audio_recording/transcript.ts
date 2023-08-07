import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import deepgramSdk from '@deepgram/sdk';
import supabase from '../../db/supabase.js'
import { storage_path, checkFileExists } from '../../helpers/storage.js';

const { Deepgram } = deepgramSdk
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

const getTranscript = async (req: Request, res: Response) => {
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
            .then(() => console.log(`saved to supabase - ${file_name}`))
            .catch(err => console.log(err))
            .then(() => {
                fs.unlink(filePath, (err) => {
                    if (err) console.log(`can't delete - ${file_name}`)
                    else console.log(`deleted - ${file_name}`)
                });
            })

        if (!response.results) {
            console.log(`unable to get a transcript from - ${file_name}`)
            res.status(400);
            return res.end();
        }

        return res.json({ transcript: response.results.channels[0].alternatives[0].transcript })
    } catch (err) {
        console.error(err);
        res.status(500);
        return res.end();
    }
}

export default getTranscript;
