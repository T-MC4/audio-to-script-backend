import express from 'express'
import { upload } from '../../utils/storage.js';
import uploadRecording from './upload.js'
import getTranscript from './transcript.js'

const router = express.Router();
// TODO: file size limit
router.post('/upload', upload.single('record'), uploadRecording)

router.post('/transcript', getTranscript)

export default router;
