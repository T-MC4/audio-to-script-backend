import { ChatOpenAI } from 'langchain/chat_models/openai';
import { approximateTokens } from './countTokens';
import { splitTranscript } from './helpers.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function removeScriptMistakes(fileName) {
    const fileNameWithoutExtension = path.parse(fileName).name;
    let filePath = `./scripts/${fileNameWithoutExtension}.txt`;

    // Determine the MAX amount of tokens available for an LLM completion
    const maxTokens = 16000;
    const usedTokens =
        approximateTokens(prompt) + approximateTokens(transcript);
    const responseTokens = maxTokens - usedTokens - 1000; // Buffer/hedge

    const parallelOptimizedTokens =
        responseTokens > 2048 ? 2048 : responseTokens;

    // Initiate an LLM instance and set the options
    const removeMistakes = new ChatOpenAI({
        openAIApiKey: OPENAI_API_KEY,
        modelName: 'gpt-3.5-16k',
        temperature: 0,
        maxTokens: parallelOptimizedTokens,
    });

    const script = await fs.readFile(filePath, 'utf-8');
    const chunks = splitTranscript(script, parallelOptimizedTokens);

    let tasks = chunks.map(async (chunk) => {
        const prompt = `${chunk}
        ------------------------
        Re-write this sales script so that spelling and grammar mistakes are removed. Also remove duplicate statements. But ALWAYS keep the exact syntax of every sentence.
        
        Here's the script without mistakes:`;

        const noMistakes = await removeMistakes.call([
            new HumanChatMessage(prompt),
        ]);

        console.log(noMistakes.text);
        return noMistakes.text;
    });

    let results = await Promise.all(tasks);

    // concatenate all results
    let cleanedScript = results.join('');

    await fs.writeFile(
        `./scripts/cleaned/${fileNameWithoutExtension}.json`,
        JSON.stringify(cleanedScript)
    );

    // return array
    return JSON.stringify(cleanedScript); // ie. [0,1,0,0,1,0,0,0,1,0,3,1]
}
