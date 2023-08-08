import express, { Request, Response } from 'express';
import deepgramSdk from '@deepgram/sdk';
import supabase from '../../db/supabase.js'

const router = express.Router();

const { Deepgram } = deepgramSdk
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

router.post('/transcripts', async (req: Request<unknown, unknown, { file_path: string }>, res: Response) => {
    const filePath = req.body.file_path;
    if (!filePath) {
        res.status(400);
        return res.end();
    }

    const { data: { publicUrl } } = supabase
        .storage
        .from(process.env.SUPABASE_BUCKET_NAME)
        .getPublicUrl(filePath)

    try {
        const deepgram = new Deepgram(deepgramApiKey);
        const response = await deepgram.transcription.preRecorded({
            url: publicUrl
        }, {
            smart_format: true,
            punctuate: true,
            paragraphs: true,
            diarize: true,
            model: 'phonecall',
            tier: 'nova',
        });



        if (!response.results) {
            console.log(`unable to get a transcript for - ${filePath}`)
            res.status(400);
            return res.end();
        }

        return res.json({ transcript: response.results.channels[0].alternatives[0].transcript })
    } catch (err) {
        console.error(err);
        res.status(400);
        return res.end();
    }
})

export default router;
