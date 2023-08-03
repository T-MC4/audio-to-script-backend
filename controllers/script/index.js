import express from 'express'
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';
import { encoding_for_model } from 'tiktoken'
import { testPrompt } from '../../utils/promptTemplates.js';

const router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const maxModelTokens = 32768; // Model's maximum context length
const tokenBuffer = 1024 * 2;

router.post('/generate', async (req, res) => {
    const transcript = req.body.transcript;

    if (!transcript) {
        res.status(400);
        return res.json({ error: 'transcript-missing' })
    }

    const formatedPrompt = await testPrompt.format({ transcript })
    const encoding = encoding_for_model('gpt-4-32k-0613');
    const tokens = encoding.encode(formatedPrompt);
    encoding.free();
    const promptTokens = tokens.length;
    console.log('promptTokens', promptTokens);
    if ((promptTokens * 2) + tokenBuffer > maxModelTokens) {
        res.status(400);
        return res.json({ error: 'context-limit-exceeded' })
    }

    const leftTokens = maxModelTokens - promptTokens - tokenBuffer;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const chain = new LLMChain({
        prompt: testPrompt,
        llm: new ChatOpenAI({
            openAIApiKey: OPENAI_API_KEY,
            modelName: 'gpt-4-32k-0613',
            temperature: 0,
            maxTokens: leftTokens,
            streaming: true,
            callbacks: [
                {
                    handleLLMNewToken(token) {
                        res.write(token);
                    },
                },
            ],
        }),
    });

    await chain.call({
        transcript
    });

    return res.end();
})

export default router;
