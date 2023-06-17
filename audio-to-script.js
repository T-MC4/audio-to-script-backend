import { transcribeDiarizedAudio } from "./deepgram-transcribe.js";
import { completePrompt } from "./generate-script.js";

// const jsonTranscript = await transcribeDiarizedAudio("thomas-bnb.mp3");
// console.log(jsonTranscript);

/**
 * @param {string} fileName - The fileName to search for
 * @param {boolean} useSingleSpeakerText - Should the prospect be removed before calling the prompt?
 * @param {boolean} useContinue - Should the prompt be a chain of 'continue:' calls, or a single big prompt?
 * @returns - The script based off of the transcript
 */
const script = await completePrompt("thomas-bnb.txt", false, true);
console.log(script);
