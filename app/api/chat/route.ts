import OpenAI from "openai";

import { adminDb }
    from "@/lib/firebaseAdmin";

import { cosineSimilarity }
    from "@/lib/cosineSimilarity";

import { navikCoreIdentity }
    from "@/lib/prompts/navikCoreIdentity";

import { activeRoles }
    from "@/lib/prompts/roles";


import { detectRole }
    from "@/lib/prompts/detectRole";

    import { topicProfiles }
    from "@/lib/prompts/topicsProfiles";

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
           TRANSCRIPTS
        ========================= */

        let transcriptsText = "";

        if (useTranscripts) {

            const transcriptsSnap =
                await adminDb
                    .collection(
                        "transcripts"
                    )
                    .where(
                        "topicId",
                        "==",
                        topicId
                    )
                    .get();

            transcriptsText =
                transcriptsSnap.docs
                    .map((doc: any) => {

                        const data =
                            doc.data();

                        return (
                            data.text ||
                            data.transcript ||
                            data.content ||
                            ""
                        );
                    })
                    .join("\n\n");
        }

        /* =========================
           GLOBAL FILES
        ========================= */

        let globalFilesText = "";

        if (useGlobalFiles) {

            const globalFilesSnap =
                await adminDb
                    .collection(
                        "globalFiles"
                    )
                    .where(
                        "topicId",
                        "==",
                        topicId
                    )
                    .get();

            globalFilesText =
                globalFilesSnap.docs
                    .map((doc: any) => {

                        const data =
                            doc.data();

                        return `
FILE:
${data.fileName}

CONTENT:
${data.extractedText}
`;
                    })
                    .join("\n\n");
        }

        /* =========================
           LOCAL FILES
        ========================= */

        let localFilesText = "";

        if (useLocalFiles) {

            localFilesText =
                uploadedFiles
                    .map(
                        (file: any) =>
                            `
FILE:
${file.name}

CONTENT:
${file.extractedText}
`
                    )
                    .join("\n\n");
        }

        /* =========================
           QUESTION EMBEDDING
        ========================= */

        let relevantChunksText = "";

        if (useGlobalFiles) {

            console.log(
                "GENERATING QUESTION EMBEDDING"
            );

            const embeddingResponse =
                await openai.embeddings.create({
                    model:
                        "text-embedding-3-small",

                    input: message,
                });

            const questionEmbedding =
                embeddingResponse
                    .data[0]
                    .embedding;

            console.log(
                "QUESTION EMBEDDING READY"
            );

            /* =========================
               GET ALL CHUNKS
            ========================= */

            const chunksSnap =
                await adminDb
                    .collection(
                        "globalFileChunks"
                    )
                    .where(
                        "topicId",
                        "==",
                        topicId
                    )
                    .get();

            console.log(
                "TOTAL CHUNKS:",
                chunksSnap.docs.length
            );

            const scoredChunks =
                chunksSnap.docs.map((doc) => {

                    const data =
                        doc.data();

                    const similarity =
                        cosineSimilarity(
                            questionEmbedding,
                            data.embedding || []
                        );

                    return {
                        text:
                            data.text,

                        similarity,
                    };
                });

            /* =========================
               SORT BEST MATCHES
            ========================= */

            scoredChunks.sort(
                (a, b) =>
                    b.similarity -
                    a.similarity
            );

            const topChunks =
                scoredChunks.slice(0, 5);

            console.log(
                "TOP CHUNKS:",
                topChunks
            );


            relevantChunksText =
                topChunks
                    .map((c) => c.text)
                    .join("\n\n");

            console.log(
                "TOP CHUNKS READY"
            );
        }

        /* =========================
           FINAL KNOWLEDGE
        ========================= */

        const knowledge = `
QUESTIONS:
${questionsText}

TRANSCRIPTS:
${transcriptsText}

SEMANTIC SEARCH RESULTS:
${relevantChunksText}

LOCAL FILES:
${localFilesText}
`;

        console.log("QUESTIONS LENGTH:", questionsText.length);

        console.log("TRANSCRIPTS LENGTH:", transcriptsText.length);

        console.log("GLOBAL FILES LENGTH:", globalFilesText.length);

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

        /* =========================
    DETECT ACTIVE ROLE
 ========================= */

        const detectedRole =
            detectRole({
                message,
            });

        console.log(
            "DETECTED ROLE:",
            detectedRole
        );

        /* =========================
           ACTIVE ROLE PROMPT
        ========================= */

        const rolePrompt =
            activeRoles[
            detectedRole as keyof typeof activeRoles
            ];


        /* =========================
ACTIVE TOPIC PROFILE
========================= */

        const activeTopicProfile =
            topicProfiles.imo;


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
The question does NOT need exact wording
inside the study materials.

Allow:
- conceptual maritime questions
- related operational questions
- related oral exam questions
- related regulatory questions
- related troubleshooting questions
- foundational theory connected to the topic

Reject ONLY if:
- completely unrelated
- programming/coding
- general non-maritime discussion
- random unrelated engineering topics
- unrelated ship systems

Return ONLY:
YES
or
NO

CURRENT TOPIC PROFILE:
${activeTopicProfile}

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

        /* =========================
           FINAL PROMPT
        ========================= */

        const prompt = `
${navikCoreIdentity}

${rolePrompt}

IMPORTANT RULES:

- Answer ONLY using the provided study materials
- Do NOT invent technical facts
- Do NOT hallucinate regulations
- If information is unavailable in the supplied materials,
clearly state that the required information is not available

- Prioritize:
  - operational understanding
  - maritime realism
  - safety awareness
  - technical clarity
  - exam relevance

- Avoid generic chatbot language
- Avoid unrelated discussion
- Keep responses professionally structured

STUDY MATERIALS:
${knowledge}

USER QUESTION:
${message}
`;

        console.log(
            "CALLING OPENAI"
        );

        const completion =
            await openai.chat.completions.create({
                model:
                    "gpt-4.1-nano-2025-04-14",

                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

        console.log(
            "OPENAI SUCCESS"
        );

        const reply =
            completion.choices[0]
                ?.message
                ?.content || "";

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