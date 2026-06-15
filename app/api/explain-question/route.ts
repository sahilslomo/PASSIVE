import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { cosineSimilarity } from "@/lib/cosineSimilarity";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { question, topicId } = await req.json();

        // 1. Create embedding for question
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: question,
        });

        const embedding = embeddingResponse.data[0].embedding;

        console.log("QUESTION EMBEDDING LENGTH:", embedding.length);

        // 2. Get all chunks for topic
        const chunksSnapshot = await adminDb
            .collection("transcriptChunks")
            .where("topicId", "==", topicId)
            .get();

        const chunks = chunksSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        console.log("TOTAL CHUNKS:", chunks.length);

        // 3. Score chunks
        const scoredChunks = chunks.map((chunk: any) => {
            if (
                !chunk.embedding ||
                !Array.isArray(chunk.embedding) ||
                !chunk.text
            ) {
                return { ...chunk, score: 0 };
            }

            if (chunk.embedding.length !== embedding.length) {
                return { ...chunk, score: 0 };
            }

            const score = cosineSimilarity(
                embedding,
                chunk.embedding
            );

            return {
                ...chunk,
                score,
            };
        });

        // 4. Sort + select top chunks
        const sortedChunks = scoredChunks.sort(
            (a, b) => b.score - a.score
        );

        const topChunks = sortedChunks
            .filter((c) => c.score >= 0.1)
            .slice(0, 7);

        const finalChunks =
            topChunks.length > 0
                ? topChunks
                : sortedChunks.slice(0, 5);

        console.log(
            "FINAL TOP CHUNKS:",
            finalChunks.map((c) => ({
                score: c.score,
                text: c.text?.slice(0, 80),
            }))
        );

        // 5. Build context
        const context = finalChunks
            .map((c) => c.text)
            .join("\n\n");

        // 6. GPT ANSWER GENERATION (🔥 MAIN ADDITION)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a strict maritime engineering tutor. " +
                        "Answer ONLY using the given context. " +
                        "If context is insufficient, say 'Not enough information in the notes.' " +
                        "Keep answer between 100–150 words. Be clear and exam-focused.",
                },
                {
                    role: "user",
                    content: `Question: ${question}\n\nContext:\n${context}`,
                },
            ],
            temperature: 0.3,
        });

        const answer =
            completion.choices[0].message.content;

        // 7. RETURN FINAL RESPONSE
        return NextResponse.json({
            success: true,
            question,
            answer,
            embeddingLength: embedding.length,
            chunkCount: chunks.length,
            topChunks: finalChunks.map((c) => ({
                text: c.text,
                score: c.score,
            })),
            context,
        });
    } catch (error) {
        console.error("EXPLAIN QUESTION ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error: String(error),
            },
            { status: 500 }
        );
    }
}