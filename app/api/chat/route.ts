import OpenAI from "openai";

import { adminDb }
    from "@/lib/firebaseAdmin";

import { navikCoreIdentity }
    from "@/lib/ai/personas/navikCoreIdentity";

import { topicProfiles }
    from "@/lib/ai/topics/topicProfiles";

import { retrieveRelevantKnowledge }
    from "@/lib/ai/retrieval/retrievalEngine";

import { buildSystemPrompt }
    from "@/lib/ai/orchestrator/orchestrator";

import { buildConversationMemory }
    from "@/lib/ai/memory/buildConversationMemory";

import { postProcessResponse }
    from "@/lib/ai/postprocess/postProcessResponse";

import { retrieveTranscriptChunks }
    from "@/lib/ai/retrieval/retrieveTranscriptChunks";

const openai =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY,
    });

export async function POST(
    req: Request
) {

    try {

        console.log("CHAT API START");

        const body =
            await req.json();

        console.log("BODY:", body);

        const {
            topicId,
            message,



            messages = [],

            useQuestions,
            useTranscripts,
            useGlobalFiles,
            useLocalFiles,

            uploadedFiles = [],
        } = body;

        /* =========================
    QUESTIONS
 ========================= */

        let questionsText = "";

        if (useQuestions) {

            const questionsSnap =
                await adminDb
                    .collection(
                        "questions"
                    )
                    .where(
                        "topicId",
                        "==",
                        topicId
                    )
                    .get();

            questionsText =
                questionsSnap.docs
                    .map((doc: any) => {

                        const data =
                            doc.data();

                        return `
Q:
${data.question || data.q}

A:
${data.answer || data.a}
`;
                    })
                    .join("\n\n");
        }

        /* =========================
        TRANSCRIPT RETRIEVAL
     ========================= */

        let transcriptChunksText = "";

        if (useTranscripts) {

            const transcriptChunks =
                await retrieveTranscriptChunks({
                    topicId,
                    message,
                    limit: 5,
                });

            transcriptChunksText =
                transcriptChunks
                    .map(
                        (chunk, index) => `

=== TRANSCRIPT CHUNK ${index + 1} ===

SIMILARITY:
${chunk.similarity}

CONTENT:
${chunk.text}

`
                    )
                    .join("\n\n");
        }

        const relevantChunksText =
            useGlobalFiles
                ? await retrieveRelevantKnowledge({
                    topicId,
                    message,
                    messages,
                })
                : "";

        let localFilesText = "";

        if (useLocalFiles) {

            localFilesText =
                uploadedFiles
                    .map(
                        (file: any) => `
FILE:
${file.name}

CONTENT:
${file.extractedText}
`
                    )
                    .join("\n\n");
        }

        /* =========================
           FINAL KNOWLEDGE
        ========================= */

        const knowledge = `
QUESTIONS:
${questionsText}

TRANSCRIPT CHUNKS:
${transcriptChunksText}

SEMANTIC SEARCH RESULTS:
${relevantChunksText}

`;

        console.log("QUESTIONS LENGTH:", questionsText.length);

        console.log("TRANSCRIPT CHUNK LENGTH:", transcriptChunksText.length);

        console.log("LOCAL FILES LENGTH:", localFilesText.length);

        console.log("FILTERS:", {
            useQuestions,
            useTranscripts,
            useGlobalFiles,
            useLocalFiles,
        });
        console.log(
            "KNOWLEDGE LENGTH:",
            knowledge.length
        );


        /* GET TOPIC PROFILE */

        const topicDoc =
            await adminDb
                .collection("topics")
                .doc(topicId)
                .get();

        const topicData =
            topicDoc.data();

        const topicProfileKey =
            topicData?.topicProfile ||
            "general";

        const activeTopicProfile =
            topicProfiles[
            topicProfileKey as keyof typeof topicProfiles
            ] ||
            `
GENERAL MARITIME TOPIC

Focus only on:
- maritime operations
- marine engineering
- oral preparation
- shipboard safety
- maritime regulations
`;


        /* =========================
TOPIC VALIDATOR
========================= */

        const topicValidationPrompt = `
You are a maritime topic relevance validator.

Your task:
Determine whether the USER QUESTION
belongs to the SAME MARITIME TOPIC
as the CURRENT TOPIC MATERIALS.

IMPORTANT:

The user does NOT need to use
exact wording from the study materials.

The question may be:
- conceptual
- operational
- oral-exam style
- troubleshooting based
- regulation related
- abbreviation related
- convention related
- practical shipboard interpretation
- safety related
- survey related
- machinery related
- maritime foundational theory

Allow:
- follow-up questions
- broader understanding questions
- "what is this" questions
- "why is this important" questions
- regulation explanation questions
- convention/source questions
- onboard application questions

Reject ONLY if the question is:
- completely unrelated to maritime industry
- pure coding/programming
- celebrity/politics/entertainment
- unrelated academic subjects
- random non-maritime discussion

IMPORTANT:

If the USER QUESTION is logically connected
to the maritime topic,
return YES.

Even if:
- exact wording is absent
- semantic wording differs
- user asks foundational understanding

Return ONLY:
YES
or
NO

CURRENT TOPIC PROFILE:
${activeTopicProfile}

CURRENT STUDY MATERIALS:
${knowledge}

USER QUESTION:
${message}
`;

        /* =========================
           VALIDATE TOPIC
        ========================= */

        const validationCompletion =
            await openai.chat.completions.create({
                model:
                    "gpt-4.1-nano-2025-04-14",

                messages: [
                    {
                        role: "user",
                        content:
                            topicValidationPrompt,
                    },
                ],

                max_tokens: 5,
            });

        const validationReply =
            validationCompletion
                .choices[0]
                ?.message
                ?.content
                ?.trim()
                ?.toUpperCase();

        console.log(
            "TOPIC VALIDATION:",
            validationReply
        );

        /* =========================
           TOPIC REJECTION
        ========================= */

        if (
            validationReply !== "YES"
        ) {

            return Response.json({
                reply:
                    "This question is outside the current topic study materials.",
            });
        }


        console.log(
            "CALLING OPENAI"
        );

        const recentMessages =
            messages
                .filter(
                    (msg: any) =>
                        typeof msg.content ===
                        "string"
                )
                .slice(-12);

        console.log(
            "CONVERSATION MEMORY:",
            recentMessages.length
        );

        const conversationHistory =
            recentMessages.map((msg: any) => ({

                role: msg.role,

                content:
                    typeof msg.content === "string"
                        ? msg.content.slice(0, 3000)
                        : "",
            }));

        /* =========================
           CONVERSATION MEMORY
        ========================= */

        const conversationMemory =
            buildConversationMemory({
                messages:
                    conversationHistory,
            });

        /* =========================
           SYSTEM PROMPT
        ========================= */

        const prompt =
            buildSystemPrompt({
                message,
                topicProfileKey,
                knowledge,
                conversationMemory,
                navikIdentity:
                    navikCoreIdentity,
            });

        const completion =
            await openai.chat.completions.create({
                model:
                    "gpt-4.1-nano-2025-04-14",

                messages: [
                    {
                        role: "system",
                        content: prompt,
                    },

                    ...conversationHistory,
                ],
                temperature: 0.3,

                max_tokens: 900,
            });

        console.log(
            "OPENAI SUCCESS"
        );

        const rawReply =
            completion.choices[0]
                ?.message
                ?.content;

        const cleanedReply =
            typeof rawReply === "string"
                ? rawReply.trim()
                : "No valid response generated.";

        const reply =
            postProcessResponse({
                response:
                    cleanedReply,
            });

        return Response.json({
            reply,
        });

    } catch (error: any) {

        console.error(
            "CHAT API ERROR:",
            error
        );

        return Response.json(
            {
                error:
                    error.message ||
                    "Server error",
            },
            {
                status: 500,
            }
        );
    }
}