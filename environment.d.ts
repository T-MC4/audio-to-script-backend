declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DEEPGRAM_API_KEY: string;
            OPENAI_API_KEY: string;
            SUPABASE_URL: string;
            SUPABASE_KEY: string;
            PORT: string | undefined;
        }
    }
}

export { };