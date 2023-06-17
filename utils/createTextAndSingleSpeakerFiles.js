import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import fs from "fs/promises";
import path from "path";

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
			const content = await fs.readFile(filePath, "utf-8");

			// remove the unwanted speaker(s) & only keep 1 speaker
			const { oneSpeakerJson, oneSpeakerText, allSpeakersText } =
				await speakerChain(content, prompt, maxTokens, speakerLabel);
			console.log(
				"oneSpeakerJson, oneSpeakerText, allSpeakersText created successfully"
			);

			// Stringify the reduced transcript and save it
			await fs.writeFile(
				`./transcripts/single-speaker-json/${fileNameWithoutExtension}.json`,
				JSON.stringify(oneSpeakerJson)
			);
			await fs.writeFile(
				`./transcripts/single-speaker-text/${fileNameWithoutExtension}.txt`,
				oneSpeakerText
			);
			await fs.writeFile(
				`./transcripts/original-text/${fileNameWithoutExtensione}.txt`,
				allSpeakersText
			);

			console.log(
				"oneSpeakerJson, oneSpeakerText, allSpeakersText saved successfully"
			);
		} catch (error) {
			console.log(error);
		}
	}
};

// USE AI TO DETERMINE WHICH SPEAKER IS THE ONE TO GET RID OF,
// THEN RETURN A JSON WITH THAT SPEAKER REMOVED
async function speakerChain(
	transcript,
	promptTemplate,
	maxTokens,
	speakerLabel
) {
	// Initate an LLM instance and set the options
	const model = new OpenAI({
		openAIApiKey: OPENAI_API_KEY,
		modelName: "gpt-4-32k",
		temperature: 0,
		maxTokens: maxTokens,
	});

	// Create an LLM/Prompt chain
	const determineUnwantedSpeakersChain = new LLMChain({
		llm: model,
		prompt: new PromptTemplate({
			template: promptTemplate,
			inputVariables: ["transcript"],
		}),
	});

	// TURN THE TRANSCRIPT ARRAY INTO AN ARRAY OF SMALLER ARRAYS (chunks)
	// Make the chunks small enough to fit into the LLM call,
	// rather than injecting the whole trancript
	const chunks = splitTranscript(transcript, maxTokens);
	console.log(chunks);

	let allSpeakersText = "";

	// Remove any speakers that aren't the sales rep
	const processedChunks = [];
	for (const chunk of chunks) {
		const speakerToKeep = await determineUnwantedSpeakersChain.call({
			transcript: JSON.stringify(chunk),
		});

		// PUSH SINGLE SPEAKER TO A JSON ARRAY
		const filteredChunk = chunk.filter(
			(obj) => obj.speaker === Number(speakerToKeep.text)
		);
		processedChunks.push(filteredChunk);

		// CONVERT JSON ARRAY TO A TEXT FILE (BUT KEEP BOTH SPEAKERS)
		let prefix =
			Number(item.speaker) === Number(speakerToKeep.text)
				? `${speakerLabel}:`
				: "*WFPTR*";
		allSpeakersText += `${prefix}\n${item.transcript}\n\n`;
	}

	// Flatten the array of arrays called 'processedChunks'
	const oneSpeakerJson = [].concat(...processedChunks);
	console.log(finalResult);

	// CONVERT SINGLE SPEAKER JSON INTO A TEXT FILE
	// (and if there is only one speaker, just turn it to text w/ speakerLabel)
	let oneSpeakerText = "";
	finalJsonResult.forEach((item) => {
		// console.log(item);
		let prefix = `${speakerLabel}:`;

		oneSpeakerText += `${prefix}\n${item.transcript}\n\n`;
	});

	// Return the JSON array of speaker objects (just one speaker)
	// Return the text content (just one speaker AND all speakers)
	return { oneSpeakerJson, oneSpeakerText, allSpeakersText };
}

// SPLIT THE TRANSCRIPT ARRAY INTO AN ARRAY OF SMALLER ARRAYS
function splitTranscript(transcriptContent, maxTokens) {
	console.log(
		"The typeof the transcript about to be split is: ",
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
	const rawTranscript = await fs.readFile(filePath, "utf-8");
	const transcript = await JSON.parse(rawTranscript);
	console.log("Transcript Passed Parse Test");
	console.log(transcript);

	if (rawTranscript.length === 0) {
		console.log("Transcript Failed Check: Transcript is empty");
		await moveTranscriptToIssueDetected(filePath);
		console.log("Transcript Moved to 'issue_detected' folder");
		return false;
	} else {
		try {
			if (!checkTranscript(transcript)) {
				console.log(
					"WARNING: Transcript is NOT empty but it does have more than 2 speakers"
				);
				// await moveTranscriptToIssueDetected(filePath);
				// console.log("Transcript Moved to 'issue_detected' folder");
				return true;
			} else {
				return true;
			}
		} catch (error) {
			console.log("Error in processTranscriptAndReturnTrueIfPass: ", error);
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
	const issueDetectedFolderPath = path.join("./transcripts", "issue_detected");
	const destinationPath = path.join(
		issueDetectedFolderPath,
		path.basename(filePath)
	);

	try {
		await fs.access(issueDetectedFolderPath);
	} catch (error) {
		if (error.code === "ENOENT") {
			await fs.mkdir(issueDetectedFolderPath, { recursive: true });
		} else {
			throw error;
		}
	}
	await fs.rename(filePath, destinationPath);
};
