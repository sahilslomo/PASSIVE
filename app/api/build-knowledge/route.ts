import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { chunkText } from "@/lib/ai/rag/chunkText";
import { adminDb } from "@/lib/firebaseAdmin";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
    req: NextRequest
) {
    try {
        const {
            transcriptId,
            topicId,
            text,
        } = await req.json();

        if (!text) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No text provided",
                },
                {
                    status: 400,
                }
            );
        }

        const chunks = chunkText({
            text,
        });

        console.log(
            "TOTAL CHUNKS:",
            chunks.length
        );

        for (const chunk of chunks) {
            const embeddingResponse =
                await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: chunk,
                });

            const embedding =
                embeddingResponse.data[0].embedding;

            console.log(
                "EMBEDDING LENGTH:",
                embeddingResponse.data[0].embedding.length
            );

            await adminDb
                .collection("transcriptChunks")
                .add({
                    transcriptId,
                    topicId,
                    text: chunk,
                    embedding,
                    createdAt: Date.now(),
                });
        }

        return NextResponse.json({
            success: true,
            chunkCount: chunks.length,
        });
    } catch (error) {
        console.error(
            "BUILD KNOWLEDGE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: String(error),
            },
            {
                status: 500,
            }
        );
    }
}