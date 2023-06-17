import {
	SystemMessagePromptTemplate,
	HumanMessagePromptTemplate,
	ChatPromptTemplate,
	MessagesPlaceholder,
} from "langchain/prompts";

export const removeSpeakerTemplate = `There are two primary speakers in the array below: Speaker A and Speaker B.

One of these Speakers is a sales rep and the other is a prospect. The sales rep is the one who introduces themselves as someone from Air Ai and/or states that the call is being recorded for quality assurance and/or talks about clients they've helped or businesses they've scaled and/or offers a consulting call and offers time to book a call.

Analyze the transcript and determine which speaker is the sales rep. Once you have the answer, just state "0" or "1" with no quotation marks:

{transcript}`;

// Define a (reusable) prompt template
export const transcriptToScriptPromptSalesRepOnly =
	ChatPromptTemplate.fromPromptMessages([
		SystemMessagePromptTemplate.fromTemplate(
			`​The job that needs to be done

        I have a rep on the phones who is doing a fantastic job. They have the best numbers on the entire team.
        
        I have a call transcript from them and I need to figure out what they're doing on the call that's different and write a new script for all my other reps to follow based on this call transcript.
        
        Here are the guidelines to follow while creating this new script:
        1. Make sure to include specific follow up questions the rep asked. The devil is in the details when it comes to what separates an okay rep from the top performing. And it's often these follow up/deepening questions that make a rep great.
        
        2. make sure to include specific language patterns the rep uses. For example, oftentimes the best reps are fairly loose and casual on the phone and sound very natural. It's important you write the script in a way where if another rep follows it closely they'll sound very similar to the high performing rep
        
        3. I want to you extract the core framework, questions, and paragraphs the rep used but do it in a way where it will apply to all prospects/customers, not just the one they talked to in this call. 
        
        4. When writing the script, make sure you write out the script for the entire call. don't cut it short and leave stuff out from the end.
        
        5. Don't change the wording the sales rep used. Don't sterilize the rep, simply format questions in a way where they'll apply to most prospects
        
        6. ONLY output what the sales rep should say, anytime there should be a prospect response simply insert *WFPTR*
        
        7. It's very important to recognize when the rep is pitching a program or offering the prospect/customer something. When you recognize they are pitching something, you should write out all those paragraphs word for word.
        
        8. Make sure to put "Rep:" before each new line in the script.
        
        9. Remember to include all relevant questions about the prospect's goals, pains, problems etc in the script
        
        10. Follow this format for writing the script:
        Rep:
        lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum

        *WFPTR*
        
        Rep:
        Lorem ipsum

        *WFPTR*

        11. Make sure you create a script component for every line in the transcript, be it Rep or *WFPTR*, even if it means writing an insanely long script that takes hours to read.
        
        Here is the call transcript with only the sales rep's lines:

        BEGINNING OF CALL TRANSCRIPT

        "{transcript}"

        END OF CALL TRANSCRIPT

        Any information that is hyper specific to the prospect that the sales rep is talking to should be replaced with [brackets] so the information from any prospect can be filled in.
        
        Don't put the same line twice in the script.
        
        START SCRIPT:
        
        Rep:`
		),
		HumanMessagePromptTemplate.fromTemplate(
			"Below is the answer you have written based on this while adhering to all the guidelines I gave you:"
		),
	]);

// Define a (reusable) prompt template
export const transcriptToScriptPrompt = ChatPromptTemplate.fromPromptMessages([
	SystemMessagePromptTemplate.fromTemplate(
		`The job that needs to be done

        I have a rep on the phones who is doing a fantastic job. They have the best numbers on the entire team.
        
        I have a call transcript from them and I need to figure out what they're doing on the call that's different and write a new script for all my other reps to follow based on this call transcript.
        
        Here are the guidelines to follow while creating this new script:
        1. Make sure to include specific follow up questions the rep asked. The devil is in the details when it comes to what separates an okay rep from the top performing. And it's often these follow up/deepening questions that make a rep great.
        
        2. make sure to include specific language patterns the rep uses. For example, oftentimes the best reps are fairly loose and casual on the phone and sound very natural. It's important you write the script in a way where if another rep follows it closely they'll sound very similar to the high performing rep
        
        3. I want to you extract the core framework, questions, and paragraphs the rep used but do it in a way where it will apply to all prospects/customers, not just the one they talked to in this call. 
        
        4. When writing the script, make sure you write out the script for the entire call. don't cut it short and leave stuff out from the end.
        
        5. Don't change the wording the sales rep used. Don't sterilize the rep, simply format questions in a way where they'll apply to most prospects
        
        6. ONLY output what the sales rep should say, anytime there should be a prospect response simply insert *WFPTR*
        
        7. It's very important to recognize when the rep is pitching a program or offering the prospect/customer something. When you recognize they are pitching something, you should write out all those paragraphs word for word.
        
        8. Make sure to put "Rep:" before each new line in the script.
        
        9. Remember to include all relevant questions about the prospect's goals, pains, problems etc in the script
        
        10. Follow this format for writing the script:
        Rep:
        lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum
        
        *WFPTR*
        
        11. Make sure you create a script component for every line in the transcript, be it Rep or *WFPTR*, even if it means writing an insanely long script that takes hours to read.
        
        Here is the call transcript:
        
        BEGINNING OF CALL TRANSCRIPT
        
        "{transcript}"
        
        END OF CALL TRANSCRIPT
        
        Any information that is hyper specific to the prospect that the sales rep is talking to should be replaced with [brackets] so the information from any prospect can be filled in.
        
        Don't put the same line twice in the script.
        
        Before you write the script tell me Which speaker is the sales rep (they may be labeled as speaker 0, speaker 1, or speaker 2 or a communication of multiple - determine which labels correspond to the sales rep).
        
        Output your answer in this format:
        Speaker(s) from transcript likely to be the sales rep:
        
        START SCRIPT:
        
        Rep:`
	),
	HumanMessagePromptTemplate.fromTemplate(
		"Below is the answer you have written based on this while adhering to all the guidelines I gave you:"
	),
]);

// PROMPT TEMPLATE WITH MEMORY SO I CAN JUST RESPOND "continue:"
export const statefulChatPrompt = (transcript) => {
	return ChatPromptTemplate.fromPromptMessages([
		SystemMessagePromptTemplate.fromTemplate(
			`The job that needs to be done
        
        I have a rep on the phones who is doing a fantastic job. They have the best numbers on the entire team.
        
        I have a call transcript from them and I need to figure out what they're doing on the call that's different and write a new script for all my other reps to follow based on this call transcript.
        
        Here are the guidelines to follow while creating this new script:
        1. Make sure to include specific follow up questions the rep asked. The devil is in the details when it comes to what separates an okay rep from the top performing. And it's often these follow up/deepening questions that make a rep great.
        
        2. make sure to include specific language patterns the rep uses. For example, oftentimes the best reps are fairly loose and casual on the phone and sound very natural. It's important you write the script in a way where if another rep follows it closely they'll sound very similar to the high performing rep
        
        3. I want to you extract the core framework, questions, and paragraphs the rep used but do it in a way where it will apply to all prospects/customers, not just the one they talked to in this call. 
        
        4. When writing the script, make sure you write out the script for the entire call. don't cut it short and leave stuff out from the end.
        
        5. Don't change the wording the sales rep used. Don't sterilize the rep, simply format questions in a way where they'll apply to most prospects
        
        6. ONLY output what the sales rep should say, anytime there should be a prospect response simply insert *WFPTR*
        
        7. It's very important to recognize when the rep is pitching a program or offering the prospect/customer something. When you recognize they are pitching something, you should write out all those paragraphs word for word.
        
        8. Make sure to put "Rep:" before each new line in the script.
        
        9. Remember to include all relevant questions about the prospect's goals, pains, problems etc in the script
        
        10. Follow this format for writing the script:
        Rep:
        lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum
        
        *WFPTR*
        
        11. Make sure you create a script component for every line in the transcript, be it Rep or *WFPTR*, even if it means writing an insanely long script that takes hours to read.
        
        Here is the call transcript:
        
        BEGINNING OF CALL TRANSCRIPT
        
        "${transcript}"
        
        END OF CALL TRANSCRIPT
        
        Any information that is hyper specific to the prospect that the sales rep is talking to should be replaced with [brackets] so the information from any prospect can be filled in.
        
        Don't put the same line twice in the script.
        
        Before you write the script tell me Which speaker is the sales rep (they may be labeled as speaker 0, speaker 1, or speaker 2 or a communication of multiple - determine which labels correspond to the sales rep).
        
        Output your answer in this format:
        Speaker(s) from transcript likely to be the sales rep:
        
        By the way, you have a limited context window so you'll cut off your answer before fully creating the script. When I respond "continue:" that is your queue to just pick up where you left off and ignore the 'continue:' is even there. On your last generation, the one where you finish writing the script, write 'SCRIPT IS NOW DONE'
        
        START SCRIPT:
        
        Rep:`
		),
		new MessagesPlaceholder("history"),
		HumanMessagePromptTemplate.fromTemplate("{input}"),
	]);
};
