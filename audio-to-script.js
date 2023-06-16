import { transcribeDiarizedAudio } from "./deepgram-transcribe.js";
import { completePrompt } from "./generate-script.js";

// const transcript = await transcribeDiarizedAudio("thomas-bnb.mp3");

// console.log(transcript);

const script = await completePrompt("thomas-bnb.json", true);

console.log(script);
