import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import fs from "fs/promises";
import path from "path";

export const removeSpeaker = async (fileName, prompt, maxTokens) => {
	const filePath = `./transcripts/${fileName}`;
	if (await processTranscriptAndReturnTrueIfPass(filePath)) {
		// If transcript only has 2 speakers, then...
		try {
			// Get the transcript contents
			const content = await fs.readFile(filePath, "utf-8");

			// remove the propsect
			const oneSpeaker = await removeSpeakerChain(content, prompt, maxTokens);
			console.log("jsonOne created successfully");

			// Stringify the reduced transcript and save it
			await fs.writeFile(
				`./scripts/working/${path.parse(fileName).name}.json`,
				JSON.stringify(oneSpeaker)
			);
			console.log("jsonOne saved successfully");
		} catch (error) {
			console.log(error);
		}
	}
};

// Gets rid of Speaker 1, then creates a list of Sales Rep Responses
async function removeSpeakerChain(transcript, promptTemplate, maxTokens) {
	const model = new OpenAI({
		openAIApiKey: OPENAI_API_KEY,
		modelName: "gpt-4-32k",
		temperature: 0,
		maxTokens: maxTokens,
	});
	const prompt = new PromptTemplate({
		template: promptTemplate,
		inputVariables: ["transcript"],
	});
	const removeSpeakerChain = new LLMChain({ llm: model, prompt: prompt });

	const chunks = splitTranscript(transcript, maxTokens);
	console.log(chunks);
	const processedChunks = [];

	for (const chunk of chunks) {
		const speakerToRemove = await removeSpeakerChain.call({
			transcript: JSON.stringify(chunk),
		});

		const filteredChunk = chunk.filter(
			(obj) => obj.speaker !== Number(speakerToRemove.text)
		);
		processedChunks.push(filteredChunk);
	}

	const finalResult = [].concat(...processedChunks);
	console.log(finalResult);

	return finalResult;
}

// SPLIT THE TRANSCRIPT
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

const processTranscriptAndReturnTrueIfPass = async (filePath) => {
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
					"Transcript Failed Check: Transcript is NOT empty but has other issue"
				);
				await moveTranscriptToIssueDetected(filePath);
				console.log("Transcript Moved to 'issue_detected' folder");
				return false;
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
