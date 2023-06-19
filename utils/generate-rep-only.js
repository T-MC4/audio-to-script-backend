import fs from 'fs/promises';
import path from 'path';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { normalizeSpeakers } from './normalize-speakers.js';
import { approximateTokens } from './countTokens.js';
import {
    processTranscriptAndReturnTrueIfNotEmpty,
    splitTranscript,
} from './helpers.js';

// GRAB THE FILE TO BE CHANGED, CHECK THAT IT ISN'T EMPTY,
// REMOVE THE SPEAKER(s) NOT WANTED, SAVE THE NEW JSON
export const generateSingleSpeakerJsonAndTextFiles = async (
    fileName,
    prompt,
    speakerLabel
) => {
    const fileNameWithoutExtension = path.parse(fileName).name;
    const filePath = `./transcripts/original-json/${fileNameWithoutExtension}.json`;
    if (await processTranscriptAndReturnTrueIfNotEmpty(filePath)) {
        // If transcript is not empty and only has 2 speakers, then...
        try {
            // Get the transcript contents
            const content = await fs.readFile(filePath, 'utf-8');

            // Normalize the content
            const normalizedContent = await normalizeSpeakers(
                JSON.parse(content)
            );
            await fs.writeFile(
                `./transcripts/normalized-json/${fileNameWithoutExtension}.json`,
                JSON.stringify(normalizedContent)
            );

            // remove the unwanted speaker(s) & only keep 1 speaker
            const { oneSpeakerJson, oneSpeakerText, allSpeakersText } =
                await generateSingleSpeakerFiles(
                    JSON.stringify(normalizedContent),
                    prompt,
                    speakerLabel
                );

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
                `./transcripts/two-speakers-text/${fileNameWithoutExtension}.txt`,
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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// TURN A JSON ARRAY INTO A SPEAKER-LABELED TEXT TRANSCRIPT.
// ADDITIONALLY, USE AI TO DETERMINE WHICH SPEAKER IS THE ONE TO KEEP,
// THEN RETURN A JSON & A TEXT FILE WITH ONLY THAT SPEAKER
async function generateSingleSpeakerFiles(
    transcript,
    promptTemplate,
    speakerLabel
) {
    // ONE chunk will be used to determined the rep - Deduce how big the chunk can be
    const spentTokens = approximateTokens(promptTemplate);
    const maxTokens = 32768;
    const tokensForResponse = 2000;
    const maxFirstChunkSize = maxTokens - spentTokens - tokensForResponse; // Buffer/hedge

    // Initiate an LLM instance and set the options
    const model = new OpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-4-32k',
        temperature: 0,
        maxTokens: tokensForResponse,
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
    const chunks = splitTranscript(transcript, maxFirstChunkSize);

    let allSpeakersText = '';

    // Remove any speakers that aren't the sales rep
    const processedChunks = [];

    console.log('BEGINNING PROCESSING');
    try {
        // Only determine the speaker to keep once, on the first chunk
        const speakerToKeep = await determineUnwantedSpeakersChain.call({
            transcript: JSON.stringify(chunks[0]),
        });

        console.log(
            `The speaker that matches '${speakerLabel}' has been determined: ${Number(
                speakerToKeep.text
            )}`
        );

        for (const chunk of chunks) {
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
            console.log('Two-Speakers text chunk complete');
        }

        // Flatten the array of arrays called 'processedChunks'
        const oneSpeakerJson = [].concat(...processedChunks);

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
