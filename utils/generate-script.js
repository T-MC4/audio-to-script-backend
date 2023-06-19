// API Data
import dotenv from 'dotenv';
dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

import path from 'path';
import fs from 'fs/promises';
//// CREATING CHAT PROMPT TEMPLATES & MANAGING PROMPTS FOR CHAT MODELS ////
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain, ConversationChain } from 'langchain/chains';
import { BufferMemory } from 'langchain/memory';
// REMOVE SPEAKER ALGORITHMICALLY INSTEAD OF VIA GPT-4 PROMPT
import { generateSingleSpeakerJsonAndTextFiles } from './createTextAndSingleSpeakerFiles.js';
// USE PROMPTS TO GENERATE SCRIPTS
import {
    transcriptToScriptPrompt,
    transcriptToScriptPromptSalesRepOnly,
    statefulChatPrompt,
    statefulSettingChatPrompt,
    removeSpeakerTemplate,
} from './promptTemplates.js';

// Rather than update the Prompt Template THEN call the model...
// Instead create a Chain, and call it with an input
// This method has the ADDED BENEFIT of internally accumulating the messages sent to the model, and the ones received as output
// It also returns an object with text, instead of the complex generations array

export async function completePrompt(
    fileName,
    setOrCloseCall = 'close',
    generateSingleSpeakerFiles = true,
    useSingleSpeakerText = true,
    useContinue = true,
    dataCallback, // Callback function to handle each piece of data
    endCallback // Callback function to call when data generation is finished
) {
    // TURN JSON ARRAY OF SPEAKER OBJECTS (multiple speakers) INTO A TEXT FILE (of multiple speakers)
    // AND ALSO INTO SINGLE-SPEAKER JSON / TEXT FILES
    if (generateSingleSpeakerFiles === true) {
        try {
            // Remove the prospect and sets the text splitter to maxTokens
            await generateSingleSpeakerJsonAndTextFiles(
                fileName,
                removeSpeakerTemplate,
                5000,
                'Rep'
            );
        } catch (err) {
            console.log(
                `Error Generating text file and/or single-speaker text/json files: ${err}`
            );
        }
    }

    const fileNameWithoutExtension = path.parse(fileName).name;
    // Default grabbing the file from the /transcripts/original-text folder
    let filePath = `./transcripts/original-text/${fileNameWithoutExtension}.txt`;
    // Set the Default prompt to use
    let prompt = transcriptToScriptPrompt;

    if (useSingleSpeakerText === true) {
        // re-set the file path to the single-speaker transcript
        filePath = `./transcripts/single-speaker-text/${fileNameWithoutExtension}.txt`;
        // change to a prompt that can handle 1 speaker
        prompt = transcriptToScriptPromptSalesRepOnly;
    }

    // Read the transcript contents from the file
    const repTranscript = await fs.readFile(filePath, 'utf-8');

    // START TIMER
    const start = performance.now();
    console.time('Create Script');

    // Guess the maxTokens left available for the completion
    // NOTE: the guess isn't 100% so set a default hedge / buffer
    const maxModelTokens = 32768; // Model's maximum context length
    const spentTokens = countTokens(repTranscript, prompt);
    const tokenBuffer = 1500;

    // Approximate the max avaialble tokens for the LLM generation
    let maxTokens = maxModelTokens - spentTokens - tokenBuffer;
    console.log(maxTokens);

    // THE SCRIPT WILL GET PUSHED HERE
    let fullResponse = '';

    // CREATE THE SCRIPT: Chhose whether to Continuosly 'press continue' OR generate the script with one call to GPT-4
    if (useContinue === true) {
        // Overwrite maxTokens with a default generation size
        //(every call of 'continue:' will output at this size)
        maxTokens = 2048;

        // Create chain and set LLM options
        const chain = new ConversationChain({
            memory: new BufferMemory({
                returnMessages: true,
                memoryKey: 'history',
            }),
            prompt:
                setOrCloseCall === 'close'
                    ? statefulChatPrompt(repTranscript)
                    : statefulSettingChatPrompt(repTranscript),
            llm: new ChatOpenAI({
                openAIApiKey: OPENAI_API_KEY,
                modelName: 'gpt-4-32k-0613',
                temperature: 0,
                maxTokens: maxTokens, // SET A PRE-DETERMINED LENGTH BEFORE COMPLETION CUTS OFF
                streaming: true,
                callbacks: [
                    {
                        handleLLMNewToken(token) {
                            process.stdout.write(token);
                            dataCallback(token);
                        },
                    },
                ],
            }),
        });

        // SET A MAX NUMBER OF TIMES TO SEND 'continue: '
        let x = Math.ceil(spentTokens / 2048);
        console.log(`The Max Number of 'continue:' attempts will be: ${x}`);

        let scriptDone = false;

        const responseH = await chain.call({
            input: 'The following is the answer you have written based on this while adhering to all the guidelines I gave you:',
        });
        dataCallback(responseH.response);
        fullResponse += responseH.response;

        // CHECK TO SEE IF THE SCRIPT COMPLETED IN THE FIRST GENERATION
        if (fullResponse.includes('SCRIPT IS NOW DONE')) {
            scriptDone = true;
        }

        // IF SCRIPT DIDN'T COMPLETE IN FIRST GEN, THEN CLICK CONTINUE TILL IT IS
        for (let i = 0; i < x && !scriptDone; i++) {
            const responseI = await chain.call({
                input: 'continue:',
            });

            // If "SCRIPT IS NOW DONE" is in the response, stop the loop.
            if (responseI.response.includes('SCRIPT IS NOW DONE')) {
                dataCallback(responseI.response);
                fullResponse += responseI.response;
                scriptDone = true;
            } else {
                dataCallback(responseI.response);
                fullResponse += responseI.response;
            }
        }
    } else {
        // Create chain and set LLM options
        const chain = new LLMChain({
            prompt: prompt,
            llm: new ChatOpenAI({
                openAIApiKey: OPENAI_API_KEY,
                modelName: 'gpt-4-32k-0613',
                temperature: 0,
                maxTokens: maxTokens,
                streaming: true,
                callbacks: [
                    {
                        handleLLMNewToken(token) {
                            process.stdout.write(token);
                        },
                    },
                ],
            }),
        });

        // Call the LLM completion
        const response = await chain.call({
            transcript: repTranscript,
        });
        dataCallback(response.response);
        // fullResponse += response.text;
        // console.log(response.text);
    }

    // Save the generated script to a file for review
    await fs.writeFile(
        `./scripts/${fileNameWithoutExtension}.txt`,
        fullResponse
    );
    // END THE CALLBACK / STREAMING OF THE SCRIPT TO CLIENT
    // When the script is done, send a final message to the client
    dataCallback({ done: true });
    endCallback();

    // END TIMER
    console.log(`Script created in ${performance.now() - start} seconds`);
    console.timeEnd('Create Script');

    // Return the generated script
    // return fullResponse;
}

//--------------------------------------------------------
// TURN CHARACTERS INTO TOKEN EQUIVALENT
function approximateTokens(text) {
    const totalChars = text.length;
    const approxTokens = Math.ceil(totalChars / 4);
    return approxTokens;
}

//--------------------------------------------------------
// GET TOKEN COUNT FOR PROMPTS/TRANSCRIPTS AND THEN DEDUCE WHAT IS LEFT OVER FOR THE RESPONSE
function countTokens(transcriptContents, promptTemplate) {
    // Count the number of tokens in the transcript
    const transcriptTokens = approximateTokens(transcriptContents); // Rough approximation

    // COUNT TOKENS

    // Get the text from transcriptToScriptPromptSalesRepOnly
    const promptText1 = promptTemplate.promptMessages[0].prompt.template;
    const promptText2 = promptTemplate.promptMessages[1].prompt.template;

    console.log(promptText1);
    console.log(promptText2);

    // Count tokens in the prompt
    const promptTokens1 = approximateTokens(promptText1); // Rough approximation
    const promptTokens2 = approximateTokens(promptText2); // Rough approximation

    // SUM prompt tokens
    const totalPromptTokens = promptTokens1 + promptTokens2;

    // SUM of prompt + transcript tokens
    const spentTokens = transcriptTokens + totalPromptTokens;

    return spentTokens;
}
