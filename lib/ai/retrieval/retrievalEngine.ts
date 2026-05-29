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


type RetrievalInput = {
    topicId: string;

    message: string;

    messages: {
        role: string;
        content: string;
    }[];
};


export async function retrieveRelevantKnowledge({
    topicId,
    message,
    messages,
}: RetrievalInput) {
    /* =========================
      REWRITE QUERY
   ========================= */

    const latestMessages =
        messages
            .slice(-6)
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n");

    const rewritePrompt = `

Conversation:
${latestMessages}

Current user message:
${message}

Rewrite the current message into a fully standalone maritime retrieval query.

Rules:
- Preserve maritime terminology
- Expand abbreviations if obvious
- Make vague follow-ups explicit
- Keep it concise
- Output ONLY the rewritten query

`;

    console.log(
        "REWRITING QUERY"
    );

    const rewriteResponse =
        await openai.chat.completions.create({

            model:
                "gpt-4.1-mini",

            messages: [

                {
                    role: "system",

                    content:
                        "You convert vague maritime follow-up questions into standalone retrieval queries."
                },

                {
                    role: "user",

                    content:
                        rewritePrompt
                }
            ]
        });

    const rewrittenQuery =
        rewriteResponse
            .choices[0]
            .message
            .content
            ?.trim() || message;

    console.log(
        "REWRITTEN QUERY:",
        rewrittenQuery
    );

    /* =========================
       CREATE QUERY EMBEDDING
    ========================= */

    console.log(
        "GENERATING QUESTION EMBEDDING"
    );

    const maritimeAcronyms: Record<string, string> = {

        "esp":
            "International Code on the Enhanced Programme of Inspections During Surveys of Bulk Carriers and Oil Tankers",

        "psc":
            "Port State Control",

        "css":
            "Cargo Securing Manual",

        "cof":
            "Certificate of Fitness",

        "csm":
            "Cargo Securing Manual",

        "imsbc":
            "International Maritime Solid Bulk Cargoes Code",

        "igc":
            "International Code for the Construction and Equipment of Ships Carrying Liquefied Gases in Bulk",

        "ism":
            "International Safety Management Code",

        "isps":
            "International Ship and Port Facility Security Code",

        "solas":
            "International Convention for the Safety of Life at Sea",

        "marpol":
            "International Convention for the Prevention of Pollution from Ships",

    };

    const embeddingResponse =
        await openai.embeddings.create({
            model:
                "text-embedding-3-small",

            input:
                rewrittenQuery,
        });

    const queryEmbedding =
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
        chunksSnap.size
    );

    /* =========================
       SCORE CHUNKS
    ========================= */

    const scoredChunks =
        chunksSnap.docs.map((doc) => {

            const data =
                doc.data();

            console.log(
                "CHUNK:",
                data.text?.slice(0, 100)
            );

            console.log(
                "EMBEDDING EXISTS:",
                !!data.embedding
            );

            console.log(
                "EMBEDDING LENGTH:",
                data.embedding?.length
            );

            const similarity =
                cosineSimilarity(
                    queryEmbedding,
                    data.embedding || []
                );

            return {

                text:
                    data.text || "",

                similarity,

                fileName:
                    data.fileName || "",

                chunkIndex:
                    data.chunkIndex || 0,
            };
        });

    /* =========================
       SORT BEST FIRST
    ========================= */

    scoredChunks.sort(
        (a, b) =>
            b.similarity -
            a.similarity
    );

    /* =========================
       REMOVE DUPLICATES
    ========================= */

    const uniqueChunks =
        Array.from(

            new Map(

                scoredChunks.map(
                    (chunk) => [

                        chunk.text
                            .slice(0, 200),

                        chunk,
                    ]
                )

            ).values()

        );

    /* =========================
       FILTER LOW QUALITY
    ========================= */

    const filteredChunks =
        uniqueChunks.filter(
            (chunk) =>
                chunk.similarity > 0.35
        );

    /* =========================
       FINAL TOP CHUNKS
    ========================= */

    const topChunks =
        filteredChunks
            .slice(0, 6);

    console.log(
        "TOP CHUNKS READY"
    );

    console.log(
        "TOTAL RETRIEVED:",
        topChunks.length
    );

    console.log(
        "BEST SCORE:",
        topChunks[0]?.similarity
    );

    console.log(
        "BEST CHUNK:",
        topChunks[0]?.text?.slice(
            0,
            500
        )
    );

    console.log(
        "TOP CHUNKS:",
        topChunks.map(
            (chunk) => ({
                similarity:
                    chunk.similarity,

                file:
                    chunk.fileName,

                chunkIndex:
                    chunk.chunkIndex,

                preview:
                    chunk.text.slice(
                        0,
                        150
                    ),
            })
        )
    );

    /* =========================
       CONTEXT COMPRESSION
    ========================= */

    const compressedContext =
        topChunks
            .map(
                (chunk, index) => `

=== RELEVANT CONTEXT ${index + 1} ===

SOURCE FILE:
${chunk.fileName}

SIMILARITY SCORE:
${chunk.similarity}

CONTENT:
${chunk.text}

`
            )
            .join("\n\n");

    console.log(
        "COMPRESSED CONTEXT LENGTH:",
        compressedContext.length
    );

    /* =========================
       RETURN FINAL CONTEXT
    ========================= */

    return compressedContext;
}