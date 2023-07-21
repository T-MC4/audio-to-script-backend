import dotenv from 'dotenv';
dotenv.config();
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

import path from 'path';
import fs from 'fs';
import pkg from '@deepgram/sdk';
const { Deepgram } = pkg;

// VERSION THAT USES THE PRE-RECORDED VERSION OF DEEPGRAM
export async function transcribeDiarizedAudio(fileNameWithExtension) {
    // Set file path
    console.log('setting file path');
    const filePath = path.join('./upload', fileNameWithExtension);
    console.log('file path set');

    // Initialize the Deepgram SDK
    const deepgram = new Deepgram(deepgramApiKey);

    let source;

    // Check whether requested file is local or remote, and prepare accordingly
    if (filePath.startsWith('http')) {
        // File is remote
        source = { url: filePath };
    } else {
        // File is local
        const audio = fs.readFileSync(filePath);
        source = {
            buffer: audio,
            mimetype: determineMimetype(filePath),
        };
    }

    let json;

    try {
        // Send the audio to Deepgram and get the response
        const response = await deepgram.transcription.preRecorded(source, {
            utterances: true,
            model: 'phonecall',
            tier: 'nova',
            multichannel: true,
            diarize: true,
            punctuate: true,
        });

        json = response.data;
        console.log(`API Call for ${fileNameWithExtension} was completed`);
    } catch (err) {
        console.error(err);
    }

    // IF &smart_format=FALSE in the url, then switch the comments of the two lines below
    // const data = transformTranscript(json);
    const data = createTranscriptArray(json);

    console.log('transcript array result:', data); // Grouping Results

    // Save the transcript
    const fileNameWithoutExtension = path.parse(fileNameWithExtension).name;
    fs.writeFileSync(
        `./transcripts/original-json/${fileNameWithoutExtension}.json`,
        JSON.stringify(data, null, 2)
    );

    // Return the transcript
    return data;
}

// const transcript = await transcribeDiarizedAudio(
// 	"REc4323a037cd0e2cde4f6bee845f598fb.mp3"
// );
// console.log(transcript);

function determineMimetype(file) {
    const extension = path.extname(file);
    switch (extension) {
        case '.wav':
            return 'audio/wav';
        case '.mp3':
            return 'audio/mpeg';
        case '.m4a':
            return 'audio/mp4';
        // Add more cases as needed for different file types
        default:
            return 'application/octet-stream'; // default to binary if unknown
    }
}

// Use this when smart_format=FALSE
function transformTranscript(data) {
    let currentSpeaker = null;
    let transcripts = [];
    let currentTranscript = '';

    data.results.channels[0].alternatives[0].words.forEach(
        (wordInfo, index, array) => {
            if (currentSpeaker === null) {
                currentSpeaker = wordInfo.speaker;
            }

            if (wordInfo.speaker === currentSpeaker) {
                currentTranscript += `${wordInfo.word} `;
            } else {
                transcripts.push({
                    speaker: currentSpeaker,
                    transcript: currentTranscript.trim(),
                });

                currentSpeaker = wordInfo.speaker;
                currentTranscript = `${wordInfo.word} `;
            }

            if (index === array.length - 1) {
                transcripts.push({
                    speaker: currentSpeaker,
                    transcript: currentTranscript.trim(),
                });
            }
        }
    );

    return transcripts;
}

// Use this when smart_format=TRUE
function createTranscriptArray(response) {
    const paragraphs =
        response.results.channels[0].alternatives[0].paragraphs.paragraphs;

    const transcriptArray = [];
    let currentSpeaker = paragraphs[0].speaker;
    let currentTranscript = '';

    paragraphs.forEach((paragraph, index) => {
        if (paragraph.speaker === currentSpeaker) {
            currentTranscript +=
                ' ' +
                paragraph.sentences.map((sentence) => sentence.text).join(' ');
        } else {
            transcriptArray.push({
                speaker: currentSpeaker,
                transcript: currentTranscript.trim(),
            });
            currentSpeaker = paragraph.speaker;
            currentTranscript = paragraph.sentences
                .map((sentence) => sentence.text)
                .join(' ');
        }

        // Make sure to add the last transcript
        if (index === paragraphs.length - 1) {
            transcriptArray.push({
                speaker: currentSpeaker,
                transcript: currentTranscript.trim(),
            });
        }
    });

    return transcriptArray;
}
