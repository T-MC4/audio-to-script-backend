// API Data
const OPENAI_API_KEY = "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";

import path from "path";
import fs from "fs/promises";
//// CREATING CHAT PROMPT TEMPLATES & MANAGING PROMPTS FOR CHAT MODELS ////
import { ChatOpenAI } from "langchain/chat_models/openai";
import { LLMChain } from "langchain/chains";
// REMOVE SPEAKER ALGORITHMICALLY INSTEAD OF VIA GPT-4 PROMPT
import { removeSpeaker } from "./utils/removeSpeaker.js";
// USE PROMPTS TO GENERATE SCRIPTS
import {
	transcriptToScriptPrompt,
	transcriptToScriptPromptSalesRepOnly,
	removeSpeakerTemplate,
} from "./utils/promptTemplates.js";

// Rather than update the Prompt Template THEN call the model...
// Instead create a Chain, and call it with an input
// This method has the ADDED BENEFIT of internally accumulating the messages sent to the model, and the ones received as output
// It also returns an object with text, instead of the complex generations array

export async function completePrompt(
	fileName,
	removeSpeakerFirstBoolean = false
) {
	// Default to grab file from the /transcripts folder
	let filePath = `./transcripts/${fileName}`;
	// Set the Default prompt to use
	let prompt = transcriptToScriptPrompt;

	// REMOVE SPEAKER ALGORITHMICALLY instead of via GPT-4 ?
	if (removeSpeakerFirstBoolean === true) {
		// We will use a text splitter; to maximize it, determine
		// the maxTokens the removeSpeaker prompt can fit
		const maxTokens = 32768 - approximateTokens(removeSpeakerTemplate) - 500;

		// Remove the prospect and sets the text splitter to maxTokens
		console.log("removing speaker");
		await removeSpeaker(fileName, removeSpeakerTemplate, maxTokens);
		console.log("removing speaker COMPLETE");

		// re-set the file path to the new transcript
		filePath = `./scripts/working/${fileName}`;
		// change to a prompt that can handle 1 speaker
		prompt = transcriptToScriptPromptSalesRepOnly;
	}

	// Read the transcript contents from the file
	const repTranscript = await fs.readFile(filePath, "utf-8");

	// Guess the maxTokens left available for the completion
	// NOTE: the guess isn't 100% so the default hedge / buffer is
	// -1,500 unless set manually as 3rd argument of countTokens()
	const maxTokens = countTokens(repTranscript, prompt);

	// START TIMER
	const start = performance.now();
	console.time("Create Script");

	// Create chain and set LLM options
	const chain = new LLMChain({
		prompt: prompt,
		llm: new ChatOpenAI({
			openAIApiKey: OPENAI_API_KEY,
			modelName: "gpt-4-32k-0613",
			temperature: 0,
			maxTokens: maxTokens,
		}),
	});

	// Call the LLM completion
	const response = await chain.call({
		transcript: repTranscript,
	});

	// Save the generated script to a file for review
	await fs.writeFile(
		`./scripts/${path.parse(fileName).name}.txt`,
		response.text
	);

	// END TIMER
	console.log(`Script created in ${performance.now() - start} seconds`);
	console.timeEnd("Create Script");

	// Return the generated script
	return response.text;
}

function approximateTokens(text) {
	const totalChars = text.length;
	const approxTokens = Math.ceil(totalChars / 4);
	return approxTokens;
}

function countTokens(transcriptContents, promptTemplate, tokenBuffer = 1500) {
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

	// SUBTRACT the SUM of prompt + transcript tokens from MAX MODEL tokens
	const maxModelTokens = 32768; // Model's maximum context length
	const maxTokens =
		maxModelTokens - transcriptTokens - totalPromptTokens - tokenBuffer;

	console.log(maxTokens);
	return maxTokens;
}
