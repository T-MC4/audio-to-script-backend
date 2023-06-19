import { approximateTokens } from './countTokens.js';
import fs from 'fs/promises';
import path from 'path';

// SPLIT THE TRANSCRIPT ARRAY INTO AN ARRAY OF SMALLER ARRAYS
export function splitTranscript(transcriptContent, maxTokens) {
    console.log(
        'The typeof the transcript about to be split is: ',
        typeof transcript,
        '(since we JSON.parse this, it should be of type STRING'
    );
    const items = JSON.parse(transcriptContent);
    const chunks = [];
    let currentChunk = [];

    for (const item of items) {
        if (
            approximateTokens(JSON.stringify(currentChunk.concat(item))) <
            maxTokens
        ) {
            currentChunk.push(item);
        } else {
            chunks.push(currentChunk);
            currentChunk = [item];
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

export const processTranscriptAndReturnTrueIfNotEmpty = async (filePath) => {
    console.log(filePath);
    const rawTranscript = await fs.readFile(filePath, 'utf-8');
    const transcript = await JSON.parse(rawTranscript);
    console.log('Transcript Passed Parse Test');
    console.log(transcript);

    if (rawTranscript.length === 0) {
        console.log('Transcript Failed Check: Transcript is empty');
        await moveTranscriptToIssueDetected(filePath);
        console.log("Transcript Moved to 'issue_detected' folder");
        return false;
    } else {
        try {
            if (!checkTranscript(transcript)) {
                console.log(
                    'WARNING: Transcript is NOT empty but it does have more than 2 speakers'
                );
                // await moveTranscriptToIssueDetected(filePath);
                // console.log("Transcript Moved to 'issue_detected' folder");
                return true;
            } else {
                return true;
            }
        } catch (error) {
            console.log(
                'Error in processTranscriptAndReturnTrueIfPass: ',
                error
            );
            await moveTranscriptToIssueDetected(filePath);
            return false;
        }
    }
};

const checkTranscript = (transcript) => {
    const validSpeakers = [0, 1];

    for (const entry of transcript) {
        if (!validSpeakers.includes(entry.speaker)) {
            return false;
        }
    }

    return true;
};

const moveTranscriptToIssueDetected = async (filePath) => {
    const issueDetectedFolderPath = path.join(
        './transcripts',
        'issue_detected'
    );
    const destinationPath = path.join(
        issueDetectedFolderPath,
        path.basename(filePath)
    );

    try {
        await fs.access(issueDetectedFolderPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(issueDetectedFolderPath, { recursive: true });
        } else {
            throw error;
        }
    }
    await fs.rename(filePath, destinationPath);
};
