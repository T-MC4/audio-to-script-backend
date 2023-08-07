import express from 'express'
import { upload } from '../../helpers/storage.js';
import getTranscript from './transcript.js'

const router = express.Router();

router.post('/upload', upload.single('record'), (req, res) => {
    res.json({
        file_name: req.file?.filename,
        mimetype: req.file?.mimetype,
    });
})

router.post('/transcript', getTranscript)

export default router;
