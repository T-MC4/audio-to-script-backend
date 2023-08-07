import { PromptTemplate } from 'langchain/prompts';
import { TranscriptSource } from './constants.js';


// TODO: investigate if we can use just `PromptTemplate` and what if a difference in this specific case
const tmeplates = {
    [TranscriptSource.audioToScript]: PromptTemplate.fromTemplate(`
        The job that needs to be done
        
        I have a sales rep on the on phones who is doing a fantastic job. They have the best numbers on the entire team.
        
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
        
        9. Remember to include all relevant questions about the prospects goals, pains, problems etc in the script
        
        10. If in the call transcript you received, there's an appointment booked for the prospect, make sure to write the script in a way where it will actually ask the prospect what time they are free. The way to do this is by asking what timezone they are in, then once you know that, suggest a few available time slots by saying something like "we have [insert available time] or [insert another available time]". YOU MUST PRESENT A FEW TIME SLOTS IN THE SCRIPT. Then after work with them to find a specific time and date from the prospect they can meet for an appointment before ending the call.
        
        11. Follow this format for writing the script:
        Rep:
        lorem ipsum
        
        *WFPTR*
        
        Rep:
        Lorem ipsum
        
        Here is the call transcript:
        "{transcript}"
        
        Before you write the script tell me Which speaker is the sales rep (they may be labeled as speaker 0, speaker 1, or speaker 2 or a communication of multiple)
        Output your answer in this format:
        Speaker:
        START SCRIPT:
        Rep:
        Below is the answer you have written based on this while adhering to all the guidelines I gave you:
    `),
    [TranscriptSource.copyPasteToScript]: PromptTemplate.fromTemplate(`
        Context:
        - So, I have a convo AI company named Air. Our product is an AI that can take sales and customer service calls over the phone for you.
        - All a business has to do is give us a script for our AI to follow - and then they can deploy our AI in minutes to call real leads.

        The problem:
        - When a business submits their script to us, it can’t have any indents or if then logic. If it does, the AI gets confused and has a hard time following along.
        - BUT we dont want the businesses that use our platform to have to reformat their script to use our product. This just creates manual work for them and ultimately creates friction that results in massive drop off of the businesses that use our platform.

        The solution:
        - You are a genius script reformatting bot. You take existing scripts and reformat it to make it easy for our AI to follow.

        How you do this:
        - Firstly, you get rid of all indents, and format the script in a way that is readable sentence by sentence
        - Secondly, you strip out if then logic entirely and create a script that is a straight line path for the AI to follow. You modify the script to where if every question was asked, it makes sense in the context of a call.
        Also, just remember to not have ANYTHING written out that you dont want said OUT LOUD by the AI. It should literally just be words that can be said by AI out loud. There should be zero instructions in your output.

        ORIGINAL SCRIPT EXAMPLE #1
        FBC Script:

        Intro:

        Hey, it’s Tyler with Russell Brunson’s Office calling for our Scheduled call about the Funnel Builder application…

        Great…. Now we have about a  20 minute window to get through this process. I am just the recommendation guy whose goal is to figure out some things about you and your application and based on that understanding…. We can then decide if moving you forward into step two EVEN makes sense.

        Step two will be a video call with our ENROLLMENT DIRECTOR where he will be the one who ultimately makes the decision if you are accepted into this month's program…

        Does that make sense?

        Quick question before we go too far in…Did you get a chance to watch the (56 min) video Russell assigned you?

        (yes) What were your main takeaways from that?
        (no) … No worries, we will get that set up to watch again if we move into step two at the end of this call.









        Research Motive:

        First things first, tell me why you're here and what caught your eye in the ad that had you taking time to fill out the application?

        (Prompts)

        What do you mean by that?
        Tell me more about that…

        Research Problem:

        Are you looking to replace income or supplement…or both?

        What exactly do you do, like what do you do for income?

        How long have you been doing that?

        Like it…love it…!

        Uncover Pain:

        Tell me where do you want to be in the next 6-12 months?
        What’s your vision for your best year?

        Ok gotcha…

        (quick recap)
        So you want (insert) in the next 6-12 months…Why do you want that?

        IMAGINE you’ve reached your best year (Recap Vision):
        What’s that do for you?



        Expose the Gap:

        So (name), you’re currently (insert current situation) and you want to get to (desired vision/goals) Question…What’s stopping you from achieving that on your own?

        3 Buckets: Knowledge, Speed, or proven plan and mentorship?

        Temp Check:

        This might seem like a weird question…but I want to know what you’re thinking. You’re currently (state their current situation)...Why not just stay where you are? (Doesn’t apply to all situations, so use based on what they do)

        Ok great..what happens if you don’t get help?

        What’s your timeline for getting help…Why is now a great time to get help?


        Create buying pocket:

        Ok…anything else I should know?

        Got it…We can definitely help you. And I want to give you a strong recommendation over to the enrollment director.

        But…. one final question: If you are accepted by the director, have we set aside the necessary funds to move forward with onboarding?








        Step 2: (Set them for an AE)

        Ok, so step 2 will allow us to get you set up on our program directors Calendar for a 30 - 45 min video call. They will determine if this 100% makes sense to invite you into the program to become a Certified Funnel Builder.

        I’m going to recommend to him that you’re a great fit and that you should be moved to the top of the list for possible acceptance. 

        The next step is to book a day and time asap for that Video call…

        SDR use this link Link to book for them (make sure you do it in their time zone)

        Confirm they got the calendar invite for a google hangout call!


        Notes temp: 

        "Hello, I am canceling today's meeting as unfortunately, I am unable to call you with the number you provided. We have almost a 0% show rate which is inhibiting others from having these slots. So we have made the decision to only service others we can call. Also so you know, the Certification program is a 10k investment that we require for enrollment if we accept you. If that is something you are ready to do today then reply back and I'll get you back on the schedule. But for now this is the direction we are going. Appreciate your time."



        SUCCESSFUL REFORMATTED SCRIPT EXAMPLE #1
        Hey, [Name]!

        Yeah, it’s Lexi. I'm with Russell Brunson’s Office calling for our scheduled call about the Funnel Builder application. We good to go?

        Great. By the way, a few people have told me that the the audio is a bit laggy today, so if I cut ya off or if there’s like a, a bit of a delay, I apologize for that in advance. But anyway, I am just the recommendation guy whose goal is to figure out some things about you and your application and based on that understanding…. We can then decide if moving you forward into step two EVEN makes sense. Sound good so far?

        Cool, then step two will be a video call with our enrollment director where he will be the one who ultimately makes the decision if you are accepted into this month's program… Does that make sense?

        Now, quick question before we go too far in… Did you get a chance to watch the 56 minute video Russell assigned you? And what were your main takeaways from that?

        Makes sense. Now, first things first here, tell me what caught your eye in the ad that had you taking time to fill out the application?

        Gotcha. Can you expound on that even more?

        Makes sense. And are you looking to replace income or supplement…or both? And exactly do you do, like what do you do for income?

        And how long have you been doing that?

        I like it and I love it. Now tell me, where do you want to be in the next 6-12 months? What’s your vision for your best year?

        Ok gotcha… So you want to [recap what they said] in the next 6-12 months…Why do you want that?

        Copy that. Now even deeper here… IMAGINE you’ve reached your best year. What’s that do for you?

        So, what’s stopping you from achieving that on your own?

        Now, this might seem like a weird question…but I want to know what you’re thinking. Why not just stay where you are?

        Ok great. And again, I know I am asking some prying questions here, but this is an important process. What happens if you don’t get help?

        Now a big question here. What’s your timeline for getting help…Why is now a great time to get help?

        Ok…anything else I should know?

        Got it…We can definitely help you. And I see no reason I can’t give you a strong recommendation to the enrollment director. But, one final question. If you are accepted by the director, have we set aside the necessary funds to move forward with onboarding?

        Ok, so step 2 will allow us to get you set up on our program directors Calendar for a 30 - 45 min video call. They will determine if this 100% makes sense to invite you into the program to become a Certified Funnel Builder. I’m going to recommend to him that you’re a great fit and that you should be moved to the top of the list for possible acceptance. 

        The next step is to book a day and time asap for that Video call… it looks like we have a [insert time from available times section in prompt] and a [insert another time from available times section in prompt], which time works best for ya?

        Awesome and just to double check there’s no reason you’d no show right, like you can 100% make the call, right?

        ok good I just wanted to make sure because we do have a policy to charge a $100 cancelation fee to protect our consultants time but it sounds like that won’t be relevant to you right?

        Great! Well im really excited to hear how you’re call goes and most importantly to see you get results. So that being said, everything is good to go over here. I hope you have an awesome rest of your day!



        ORIGINAL SCRIPT EXAMPLE #2
        Outbound Call Script
        Protocol:
        You call, they don’t answer. You set the phone down, and immediately call again. If they
        don’t answer on the second call, THEN you leave a VM & text.
        Text:
        Hey NAME, (Your name) here. Did you just download our practice growth guide? Lmk if you
        have 2 seconds, just wanna make sure you’re taken care of..
        Script:
        Hey is this
        (NAME)
        ?!
        Hey
        (NAME)
        ! This is
        (YOUR NAME)
        from PracticeOwner. You recently downloaded some
        info on bringing more patients & profit into your healthcare practice. The info from James
        Neilson
        -
        Watt. I’m following up to see that you got access ok?
        (whether they remember or not is irrelevant)
        No wo
        rries, look, the reason for the call today
        (NAME)
        is that you’re actually also supposed
        to get one of James’s paid mastermind trainings for free as well..
        We have tons of stuff and I wanted to make sure you got something that was actually relevant
        & usef
        ul to what you need help with right now.
        You got a minute for me to get that for you real quick?
        (IF NO
        -
        SCHEDULE TRIAGE NO MORE THAN 48 HOURS)
        No worries, are you free tomorrow for a quick chat?
        It’ll only take 10min, max...
        What is your timezone?
        Would you prefer morning, afternoon or evening?
        Great, how about
        (offer 2 times in their timezone)
        ?
        Perfect, let me confirm I have the right details your email is, and your number is, and full
        name is...
        (Confirm their details and book it)
        Perfect, I ha
        ve you booked, you will get an email confirmation shortly.
        In the meantime I want to send you a little something before our call.
        What is your name on Facebook and I’ll add you and send it over?
        (if they want it emailed just say that it’s something
        on FB so it is much easier to just send it
        from there
        -
        BUT DON’T STRESS THEM SO IF THEY DON’T WANT IT ON FB JUST
        LEAVE IT AND EMAIL THEM INSTEAD)
        Speak to you tomorrow at 9am
        (WHATEVER TIMEZONE THEY ARE IN)
        !


        SUCCESSFUL REFORMATTED SCRIPT EXAMPLE #2
        Hey, [Prospect Name]!

        Yeah, it's Alexander, from Practice Owner dot com and you recently downloaded some info on bringing more patients and profit into your healthcare practice. The info from James Neilson Watt. I’m following up to see that you got access to that and to make sure you didn't have any issues?

        No worries. I'm just giving you a fast call because you are actually also supposed to get one of James’s paid mastermind trainings for free as well. We actually have tons of stuff and I wanted to make sure you got something that was actually relevant & useful to what you need help with right now. Are you free tomorrow for a quick chat on that? It’ll only take 10 minutes max.

        Sweet. That said so I can get this setup for you what city are you in so I can check your timezone?

        ok it looks like we have a [insert time from available times section in prompt] and a [insert another time from available times section in prompt], which time works best for you?

        And just to double check there’s no reason you would not show up right? Like you can one hundred percent make the call?

        In the meantime I want to send you a little something before our call. What is your name on Facebook and I’ll add you and send it over?

        Awesome. Well thanks for your time! Looking forward to chatting tomorrow.


        BONUS: ANOTHER GOOD SCRIPT TO MODEL…
        Hey, Prospect Name!

        Yeah, it's Alexander from Air Dot AI? How's your day going so far?

        Yeah, so it looks like you opted into one of our ads looking for information on how to scale your business using AI. Do you remember that?

        Ok, sweet. Well the reason I'm calling you is I'm actually a manager over here on Air's client success team on a recorded line, and they give us about 3 to 5 minutes to check in with you, to see if there's any way we can help you. And by the way, a few people have told me that the audio is a bit laggy today, so if I cut you off or if there's like a bit of a delay, I apologize for that in advance. But yeah, anyways, I'm curious for you, what had you looking into using AI to scale your business?

        So, let's say like everything went just perfectly, and you were using Air to scale a high-ticket business. How much money would you actually want to be making each month? Like ideal outcome a year from now or so?

        Sweet. Now, I'm just curious, why that number specifically? Like, what gets you excited about hitting that number?

        Can you tell me more about that? Just expound a bit more.

        Ok, now let me ask you this. What's one word you'd use to describe how you'd feel hitting that number? For example, would it be freedom, excitement, relief, like what's that word for you?

        Why [their word] specifically?

        On a scale from, say like, 1 to 10... you know, how much would you have that word [insert their word] at your ideal income?

        Now, on the flip side here, on the same scale of 1 to 10 right. How much do you feel like you have that word currently?

        Why so low?

        Well based on our conversation, I have 2 resources for you that I think would really help you out… do you want me to send those to you?

        The first one is a training on how we scaled to 4 million dollars a month, and the second is a free consulting call with one of our executive consultants to help you with the things we talked about. That said so I can get this setup for you what city are you in so I can check your timezone?

        Ok it looks like we have a [insert time from available times section in prompt] and a [insert another time from available times section in prompt], which time works best for you?

        I'll lock in that time for you. Also, I'm about to send you the training can you commit to watching it before your call since it's vital to you both getting the most out of the complimentary consulting session.

        And just to double check there's no reason you would not show up right? Like you can one hundred percent make the call?

        Ok good I just wanted to make sure because we do have a policy to charge a hundred dollar cancellation fee to protect our consultants time but it sounds like that won't be relevant to you right?

        Well I'm really excited to hear how your call goes and most importantly to see you get results. So that being said, everything is good to go over here. I hope you have an awesome rest of your day!


        Here is the script you need to reformat:
        "{transcript}"


        Go:
    `)
} as const;

export default tmeplates;
