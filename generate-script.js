// API Data
const OPENAI_API_KEY = "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";

import path from "path";
import fs from "fs/promises";
//// CREATING CHAT PROMPT TEMPLATES & MANAGING PROMPTS FOR CHAT MODELS ////
import { ChatOpenAI } from "langchain/chat_models/openai";
import { LLMChain, ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
// REMOVE SPEAKER ALGORITHMICALLY INSTEAD OF VIA GPT-4 PROMPT
import { generateSingleSpeakerJsonAndTextFiles } from "./utils/createTextAndSingleSpeakerFiles.js";
// USE PROMPTS TO GENERATE SCRIPTS
import {
	transcriptToScriptPrompt,
	transcriptToScriptPromptSalesRepOnly,
	statefulChatPrompt,
	removeSpeakerTemplate,
} from "./utils/promptTemplates.js";

// Rather than update the Prompt Template THEN call the model...
// Instead create a Chain, and call it with an input
// This method has the ADDED BENEFIT of internally accumulating the messages sent to the model, and the ones received as output
// It also returns an object with text, instead of the complex generations array

export async function completePrompt(
	fileName,
	useSingleSpeakerText = false,
	useContinue = false
) {
	// TURN JSON ARRAY OF SPEAKER OBJECTS (multiple speakers) INTO A TEXT FILE (of multiple speakers)
	// AND ALSO INTO SINGLE-SPEAKER JSON / TEXT FILES
	try {
		// We will use a text splitter; to maximize it, determine
		// the maxTokens the removeSpeaker prompt can fit
		const maxTokens = 32768 - approximateTokens(removeSpeakerTemplate) - 500;

		// Remove the prospect and sets the text splitter to maxTokens
		console.log("Generating text file and single-speaker text/json files");
		await generateSingleSpeakerJsonAndTextFiles(
			fileName,
			removeSpeakerTemplate,
			maxTokens,
			"Rep"
		);
		console.log(
			"Generating text file and single-speaker text/json files COMPLETE"
		);
	} catch (err) {
		console.log(
			`Error Generating text file and/or single-speaker text/json files: ${err}`
		);
	}

	// Default grabbing the file from the /transcripts/original-text folder
	let filePath = `./transcripts/original-text/${fileName}`;
	// Set the Default prompt to use
	let prompt = transcriptToScriptPrompt;

	if (useSingleSpeakerText === true) {
		// re-set the file path to the single-speaker transcript
		filePath = `./scripts/single-speaker-text/${fileName}`;
		// change to a prompt that can handle 1 speaker
		prompt = transcriptToScriptPromptSalesRepOnly;
	}

	// Read the transcript contents from the file
	const repTranscript = await fs.readFile(filePath, "utf-8");

	// START TIMER
	const start = performance.now();
	console.time("Create Script");

	// Guess the maxTokens left available for the completion
	// NOTE: the guess isn't 100% so set a default hedge / buffer
	const maxModelTokens = 32768; // Model's maximum context length
	const spentTokens = countTokens(repTranscript, prompt);
	const tokenBuffer = 1500;

	// Approximate the max avaialble tokens for the LLM generation
	let maxTokens = maxModelTokens - spentTokens - tokenBuffer;
	console.log(maxTokens);

	// Continuosly 'press continue' OR generate the script with one call to GPT-4
	let fullResponse = "";
	if (useContinue === true) {
		// Overwrite maxTokens with a default generation size
		//(every call of 'continue:' will output at this size)
		maxTokens = 2048;

		// Create chain and set LLM options
		const chain = new ConversationChain({
			memory: new BufferMemory({ returnMessages: true, memoryKey: "history" }),
			prompt: statefulChatPrompt(repTranscript),
			llm: new ChatOpenAI({
				openAIApiKey: OPENAI_API_KEY,
				modelName: "gpt-4-32k-0613",
				temperature: 0,
				maxTokens: maxTokens, // SET A PRE-DETERMINED LENGTH BEFORE COMPLETION CUTS OFF
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

		let scriptDone = false;
		const responseH = await chain.call({
			input:
				"The following is the answer you have written based on this while adhering to all the guidelines I gave you:",
		});
		fullResponse += responseH.response;

		if (fullResponse.includes("SCRIPT IS NOW DONE")) {
			scriptDone = true;
		}

		for (let i = 0; i < x && !scriptDone; i++) {
			const responseI = await chain.call({
				input: "continue:",
			});

			// If "SCRIPT IS NOW DONE" is in the response, stop the loop.
			if (responseI.response.includes("SCRIPT IS NOW DONE")) {
				fullResponse += responseI.response;
				scriptDone = true;
			} else {
				fullResponse += responseI.response;
			}
		}

		// specify the number of times you want to click 'continue'
		// assume that the script outputted is half the length transcript
		// then divide that length by the # of tokens that fit per chain call
		// let x = Math.ceil(spentTokens / 1.5 / maxTokens);
		// console.log(x);
		// for (let i = 0; i < x; i++) {
		// 	const responseI = await chain.call({
		// 		input: "continue:",
		// 	});
		// 	// console.log(responseI.response);
		// 	fullResponse += responseI.response;
		// }
	} else {
		// Create chain and set LLM options
		const chain = new LLMChain({
			prompt: prompt,
			llm: new ChatOpenAI({
				openAIApiKey: OPENAI_API_KEY,
				modelName: "gpt-4-32k-0613",
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
		fullResponse += response.text;
		// console.log(response.text);
	}

	// Save the generated script to a file for review
	await fs.writeFile(
		`./scripts/${path.parse(fileName).name}.txt`,
		fullResponse
	);

	// END TIMER
	console.log(`Script created in ${performance.now() - start} seconds`);
	console.timeEnd("Create Script");

	// Return the generated script
	return fullResponse;
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
