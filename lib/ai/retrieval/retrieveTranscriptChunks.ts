import OpenAI from "openai";
import { adminDb } from "@/lib/firebaseAdmin";
import { cosineSimilarity } from "@/lib/cosineSimilarity";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type RetrieveTranscriptInput = {
    topicId: string;
    message: string;
    limit?: number;
};

export async function retrieveTranscriptChunks({
    topicId,
    message,
    limit = 5,
}: RetrieveTranscriptInput) {
    try {
        /* =========================
           CREATE EMBEDDING
        ========================= */

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: message,
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        /* =========================
           GET TRANSCRIPT CHUNKS
        ========================= */

        const snap = await adminDb
            .collection("transcriptChunks")
            .where("topicId", "==", topicId)
            .get();

        /* =========================
           SCORE CHUNKS
        ========================= */

        const scored = snap.docs.map((doc) => {
            const data = doc.data();

            return {
                text: data.text || "",
                similarity: cosineSimilarity(
                    queryEmbedding,
                    data.embedding || []
                ),
            };
        });

        /* =========================
           SORT BY SIMILARITY
        ========================= */

        scored.sort((a, b) => b.similarity - a.similarity);

        /* =========================
           RETURN TOP RESULTS
        ========================= */

        return scored.slice(0, limit);
    } catch (error) {
        console.error("retrieveTranscriptChunks error:", error);
        return [];
    }
}