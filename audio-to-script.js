import { transcribeDiarizedAudio } from './deepgram-transcribe.js';
import { completePrompt } from './generate-script.js';

// CLOSE CALLS
await transcribeDiarizedAudio('air-close-call.mp3');
await transcribeDiarizedAudio('cole-traffic-and-funnels.mp3');
await transcribeDiarizedAudio('sam-fowler-air.mp3');

// SET CALLS
await transcribeDiarizedAudio('Brittney Air Set - Levi.mp3');
await transcribeDiarizedAudio('josh nebblett.mp3');
await transcribeDiarizedAudio('Kim set - Levi.mp3');
await transcribeDiarizedAudio('Tyler PIF Deep Gap.mp3');

/**
 * @param {string} fileName - The file name of the transcript to inject into the prompt
 * @param {string} setOrCloseCall - Use either a 'set' or 'close' prompt based on the type of script is needed
 * @param {boolean} generateSingleSpeakerFiles - Generate (or re-write) the single-speaker transcripts for fileName
 * @param {boolean} useSingleSpeakerText - Inject into the prompt the single-speaker transcript instead of the orginal
 * @param {boolean} useContinue - Should the prompt be a chain of 'continue:' calls, or a single big prompt?
 * @returns - The script based off of the transcript
 */

// CLOSE CALLS
await completePrompt('air-close-call.txt', true, true, true);
await completePrompt('cole-traffic-and-funnels.txt', true, true, true);
await completePrompt('sam-fowler-air.txt', true, true, true);

// SET CALLS
await completePrompt('Brittney Air Set - Levi.txt', 'set', true, true, true);
await completePrompt('josh nebblett.txt', 'set', true, true, true);
await completePrompt('Kim set - Levi.txt', 'set', true, true, true);
await completePrompt('Tyler PIF Deep Gap.txt', 'set', true, true, true);
