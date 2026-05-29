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

type RetrieveChunksInput = {
    topicId: string;
    message: string;
    limit?: number;
};

export async function retrieveRelevantChunks({
    topicId,
    message,
    limit = 5,
}: RetrieveChunksInput) {

    /* =========================
       CREATE QUERY EMBEDDING
    ========================= */

    const embeddingResponse =
        await openai.embeddings.create({
            model:
                "text-embedding-3-small",

            input: message,
        });

    const queryEmbedding =
        embeddingResponse
            .data[0]
            .embedding;

    console.log(
        "QUERY EMBEDDING CREATED"
    );

    console.log(
        "EMBEDDING LENGTH:",
        queryEmbedding.length
    );

    /* =========================
       GET CHUNKS
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
        "TOTAL DB CHUNKS:",
        chunksSnap.docs.length
    );

    /* =========================
       CALCULATE SIMILARITY
    ========================= */

    const scoredChunks =
        chunksSnap.docs.map((doc) => {

            const data =
                doc.data();

            const similarity =
                cosineSimilarity(
                    queryEmbedding,
                    data.embedding || []
                );

            return {
                text:
                    data.text || "",

                similarity,
            };
        });

    /* =========================
       SORT
    ========================= */

    scoredChunks.sort(
        (a, b) =>
            b.similarity -
            a.similarity
    );

    /* =========================
       DEBUG
    ========================= */

    console.log(
        "TOTAL RETRIEVED CHUNKS:",
        scoredChunks.length
    );

    console.log(
        "BEST SCORE:",
        scoredChunks[0]?.similarity
    );

    console.log(
        "BEST CHUNK:",
        scoredChunks[0]?.text?.slice(
            0,
            500
        )
    );

    console.log(
        "TOP 5 SCORES:",
        scoredChunks
            .slice(0, 5)
            .map(
                (chunk) =>
                    chunk.similarity
            )
    );

    /* =========================
       RETURN TOP CHUNKS
    ========================= */

    return scoredChunks
        .slice(0, limit);
}