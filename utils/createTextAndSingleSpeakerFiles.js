import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import fs from 'fs/promises';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// GRAB THE FILE TO BE CHANGED, CHECK THAT IT ISN'T EMPTY,
// REMOVE THE SPEAKER(s) NOT WANTED, SAVE THE NEW JSON
export const generateSingleSpeakerJsonAndTextFiles = async (
    fileName,
    prompt,
    maxTokens,
    speakerLabel
) => {
    const fileNameWithoutExtension = path.parse(fileName).name;
    const filePath = `./transcripts/original-json/${fileNameWithoutExtension}.json`;
    if (await processTranscriptAndReturnTrueIfNotEmpty(filePath)) {
        // If transcript is not empty and only has 2 speakers, then...
        try {
            // Get the transcript contents
            const content = await fs.readFile(filePath, 'utf-8');

            // remove the unwanted speaker(s) & only keep 1 speaker
            const { oneSpeakerJson, oneSpeakerText, allSpeakersText } =
                await speakerChain(content, prompt, maxTokens, speakerLabel);

            // LOG THE RESULTING TRANSCRIPTS
            console.log(oneSpeakerJson, oneSpeakerText, allSpeakersText);
            console.log(
                'oneSpeakerJson, oneSpeakerText, allSpeakersText created successfully'
            );

            // Save the transformed transcripts
            await fs.writeFile(
                `./transcripts/single-speaker-json/${fileNameWithoutExtension}.json`,
                JSON.stringify(oneSpeakerJson)
            );
            await fs.writeFile(
                `./transcripts/single-speaker-text/${fileNameWithoutExtension}.txt`,
                oneSpeakerText
            );
            await fs.writeFile(
                `./transcripts/original-text/${fileNameWithoutExtension}.txt`,
                allSpeakersText
            );

            console.log(
                'oneSpeakerJson, oneSpeakerText, allSpeakersText saved successfully'
            );
        } catch (error) {
            console.log(
                'error with generating single-speaker json/text files: ',
                error
            );
        }
    }
};

// TURN A JSON ARRAY INTO A SPEAKER-LABELED TEXT TRANSCRIPT.
// ADDITIONALLY, USE AI TO DETERMINE WHICH SPEAKER IS THE ONE TO KEEP,
// THEN RETURN A JSON & A TEXT FILE WITH ONLY THAT SPEAKER
async function speakerChain(
    transcript,
    promptTemplate,
    maxTokens,
    speakerLabel
) {
    // Initiate an LLM instance and set the options
    const model = new OpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-4-32k',
        temperature: 0,
        maxTokens: maxTokens,
    });

    // Create an LLM/Prompt chain
    const determineUnwantedSpeakersChain = new LLMChain({
        llm: model,
        prompt: new PromptTemplate({
            template: promptTemplate,
            inputVariables: ['transcript'],
        }),
    });

    // TURN THE TRANSCRIPT ARRAY INTO AN ARRAY OF SMALLER ARRAYS (chunks)
    // Make the chunks small enough to fit into the LLM call, rather than
    // injecting the whole trancript
    const chunks = splitTranscript(transcript, maxTokens);
    console.log(chunks);

    let allSpeakersText = '';

    // Remove any speakers that aren't the sales rep
    const processedChunks = [];

    console.log('BEGINNING PROCESSING');
    try {
        for (const chunk of chunks) {
            const speakerToKeep = await determineUnwantedSpeakersChain.call({
                transcript: JSON.stringify(chunk),
            });
            console.log(
                `The speaker that matches '${speakerLabel}' has been determined`
            );

            // PUSH SINGLE SPEAKER TO A JSON ARRAY
            const filteredChunk = chunk.filter(
                (obj) => obj.speaker === Number(speakerToKeep.text)
            );
            processedChunks.push(filteredChunk);
            console.log('Single-Speaker JSON chunk complete');

            // CONVERT JSON ARRAY TO A TEXT FILE (BUT KEEP BOTH SPEAKERS)
            chunk.forEach((item) => {
                let prefix =
                    Number(item.speaker) === Number(speakerToKeep.text)
                        ? `${speakerLabel}:`
                        : '*WFPTR*';
                allSpeakersText += `${prefix}\n${item.transcript}\n\n`;
            });
            console.log('All-Speakers text chunk complete');
        }

        // Flatten the array of arrays called 'processedChunks'
        const oneSpeakerJson = [].concat(...processedChunks);
        // console.log(oneSpeakerJson);

        // CONVERT SINGLE SPEAKER JSON INTO A TEXT FILE
        let oneSpeakerText = '';

        oneSpeakerJson.forEach((item) => {
            let prefix = `${speakerLabel}:`;
            oneSpeakerText += `${prefix}\n${item.transcript}\n\n`;
        });
        console.log('Single-Speaker text chunk complete');

        // Return the JSON array of speaker objects (just one speaker)
        // Return the text transcripts (one speaker AND all speakers)
        return { oneSpeakerJson, oneSpeakerText, allSpeakersText };
    } catch (err) {
        console.log(`Problem with determineUnwantedSpeakerChain(): ${err}`);
    }
}

// SPLIT THE TRANSCRIPT ARRAY INTO AN ARRAY OF SMALLER ARRAYS
function splitTranscript(transcriptContent, maxTokens) {
    console.log(
        'The typeof the transcript about to be split is: ',
        typeof transcript
    );
    const items = JSON.parse(transcriptContent);
    const chunks = [];
    let currentChunk = [];

    for (const item of items) {
        if (JSON.stringify(currentChunk.concat(item)).length < maxTokens) {
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

const processTranscriptAndReturnTrueIfNotEmpty = async (filePath) => {
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
