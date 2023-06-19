//--------------------------------------------------------
// TURN CHARACTERS INTO TOKEN EQUIVALENT
export function approximateTokens(text) {
    const totalChars = text.length;
    const approxTokens = Math.ceil(totalChars / 4);
    return approxTokens;
}

//--------------------------------------------------------
// GET TOKEN COUNT FOR PROMPTS/TRANSCRIPTS (THIS CAN BE USED LATER TO THEN DEDUCE WHAT IS LEFT OVER FOR THE LLM CALL)
export function spentTokens(textOnly, promptTemplate = 0) {
    // Count the number of tokens in the transcript
    const transcriptTokens = approximateTokens(textOnly); // Rough approximation

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
