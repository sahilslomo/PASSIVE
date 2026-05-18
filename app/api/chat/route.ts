import OpenAI from "openai";

import { adminDb }
    from "@/lib/firebaseAdmin";

import { cosineSimilarity }
    from "@/lib/cosineSimilarity";

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

        const prompt = `
You are a topic-restricted AI study assistant.

IMPORTANT RULES:

- Answer ONLY using the provided study materials.
- Do NOT use outside/general knowledge.
- Do NOT invent answers.
- If the answer is not found in the study materials, say:

"This question is not related to the current topic study materials or the required data is not available yet."

- Do NOT generate:
  - files
  - code projects
  - essays
  - stories
  - unrelated content
  - roleplay
  - markdown downloads
  - fake information

Only provide educational answers strictly based on the provided topic data.

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