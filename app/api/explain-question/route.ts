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
        const transcriptSnapshot = await adminDb
            .collection("transcriptChunks")
            .where("topicId", "==", topicId)
            .get();

        const transcriptChunks =
            transcriptSnapshot.docs.map((doc) => ({
                id: doc.id,
                source: "transcript",
                ...doc.data(),
            }));

        const globalSnapshot = await adminDb
            .collection("globalFileChunks")
            .where("topicId", "==", topicId)
            .get();

        const globalChunks =
            globalSnapshot.docs.map((doc) => ({
                id: doc.id,
                source: "global",
                ...doc.data(),
            }));

        const chunks = [
            ...transcriptChunks,
            ...globalChunks,
        ];

        console.log(
            "TRANSCRIPT CHUNKS:",
            transcriptChunks.length
        );

        console.log(
            "GLOBAL FILE CHUNKS:",
            globalChunks.length
        );

        console.log(
            "TOTAL SEARCHABLE CHUNKS:",
            chunks.length
        );

        console.log("TOTAL CHUNKS:", chunks.length);

        // 3. Score chunks
        const stopWords = [
            "what",
            "is",
            "are",
            "the",
            "a",
            "an",
            "of",
            "for",
            "why",
            "how",
            "when",
            "where",
            "explain",
        ];

        const questionWords: string[] = question
            .toLowerCase()
            .split(/\s+/)
            .filter(
                (w: string) =>
                    w.length > 2 &&
                    !stopWords.includes(w)
            );

        const scoredChunks = chunks.map((chunk: any) => {

            let vectorScore = 0;

            if (
                chunk.embedding &&
                Array.isArray(chunk.embedding) &&
                chunk.text &&
                chunk.embedding.length === embedding.length
            ) {
                vectorScore = cosineSimilarity(
                    embedding,
                    chunk.embedding
                );
            }

            const chunkText =
                String(chunk.text || "").toLowerCase();

            let keywordScore = 0;

            for (const word of questionWords) {

                if (word.length < 3) continue;

                if (chunkText.includes(word)) {
                    keywordScore += 1;
                }
            }

            if (
                chunkText.includes(
                    question.toLowerCase()
                )
            ) {
                keywordScore += 2;
            }

            keywordScore =
                keywordScore /
                Math.max(questionWords.length, 1);

            const hybridScore =
                vectorScore * 0.6 +
                keywordScore * 0.4;

            return {
                ...chunk,
                vectorScore,
                keywordScore,
                score: hybridScore,
            };
        });

        // 4. Sort + select top chunks
        const sortedChunks = scoredChunks.sort(
            (a, b) => b.score - a.score
        );

        const topChunks = sortedChunks
            .filter((c) => c.score >= 0.05)
            .slice(0, 25);

        const finalChunks =
            topChunks.length > 0
                ? topChunks
                : sortedChunks.slice(0, 5);

        console.log(
            "TOP CHUNKS",
            finalChunks.map((c) => ({
                hybrid: c.score,
                vector: c.vectorScore,
                keyword: c.keywordScore,
                text: c.text?.slice(0, 100),
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
                source: c.source,
                score: c.score,
                vectorScore: c.vectorScore,
                keywordScore: c.keywordScore,
                text: c.text,
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