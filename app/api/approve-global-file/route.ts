import { NextResponse } from "next/server";

import { adminDb }
    from "@/lib/firebaseAdmin";

import { chunkText }
    from "@/lib/ai/rag/chunkText";

import OpenAI from "openai";

const openai =
    new OpenAI({
        apiKey:
            process.env.OPENAI_API_KEY,
    });

export async function POST(
    request: Request
) {

    try {

        const body =
            await request.json();

        const {
            requestId,
        } = body;

        if (!requestId) {

            return NextResponse.json(
                {
                    error:
                        "Missing requestId",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "========================"
        );

        console.log(
            "STARTING APPROVAL FLOW"
        );

        console.log(
            "REQUEST ID:",
            requestId
        );

        /* =========================
           GET REQUEST DOC
        ========================= */

        const requestDoc =
            await adminDb
                .collection(
                    "globalFileRequests"
                )
                .doc(requestId)
                .get();

        if (!requestDoc.exists) {

            console.log(
                "REQUEST DOC NOT FOUND"
            );

            return NextResponse.json(
                {
                    error:
                        "Request not found",
                },
                {
                    status: 404,
                }
            );
        }

        console.log(
            "REQUEST DOC FOUND"
        );

        const data =
            requestDoc.data();

        /* =========================
           VALIDATE TEXT
        ========================= */

        const extractedText =
            data?.extractedText || "";

        if (!extractedText) {

            console.log(
                "NO EXTRACTED TEXT FOUND"
            );

            return NextResponse.json(
                {
                    error:
                        "No extracted text found",
                },
                {
                    status: 400,
                }
            );
        }

        console.log(
            "TEXT LENGTH:",
            extractedText.length
        );

        /* =========================
           CHUNK TEXT
        ========================= */

        const chunks =
            chunkText({
                text:
                    extractedText,
            });

        console.log(
            "TOTAL CHUNKS:",
            chunks.length
        );

        console.log(
            "FIRST CHUNK PREVIEW:"
        );

        console.log(
            chunks[0]?.slice(
                0,
                300
            )
        );

        /* =========================
           SAVE GLOBAL FILE
        ========================= */

        const globalFileRef =
            await adminDb
                .collection(
                    "globalFiles"
                )
                .add({
                    topicId:
                        data?.topicId,

                    fileName:
                        data?.fileName,

                    extractedText:
                        extractedText,

                    createdAt:
                        Date.now(),
                });

        console.log(
            "GLOBAL FILE CREATED:"
        );

        console.log(
            globalFileRef.id
        );

        /* =========================
           SAVE CHUNKS + EMBEDDINGS
        ========================= */

        let savedCount = 0;

        let failedCount = 0;

        for (
            let i = 0;
            i < chunks.length;
            i++
        ) {

            try {

                console.log(
                    "===================="
                );

                console.log(
                    "PROCESSING CHUNK:",
                    i
                );

                const currentChunk =
                    chunks[i];

                if (
                    !currentChunk
                ) {

                    console.log(
                        "EMPTY CHUNK SKIPPED:",
                        i
                    );

                    failedCount++;

                    continue;
                }

                console.log(
                    "CHUNK LENGTH:",
                    currentChunk.length
                );

                console.log(
                    "CHUNK PREVIEW:"
                );

                console.log(
                    currentChunk.slice(
                        0,
                        200
                    )
                );

                /* =========================
                   GENERATE EMBEDDING
                ========================= */

                console.log(
                    "GENERATING EMBEDDING:",
                    i
                );

                const embeddingResponse =
                    await openai.embeddings.create({
                        model:
                            "text-embedding-3-small",

                        input:
                            currentChunk,
                    });

                console.log(
                    "EMBEDDING GENERATED:",
                    i
                );

                const embedding =
                    embeddingResponse
                        .data[0]
                        .embedding;

                console.log(
                    "EMBEDDING LENGTH:",
                    embedding.length
                );

                console.log(
                    "EMBEDDING SAMPLE:"
                );

                console.log(
                    embedding.slice(
                        0,
                        5
                    )
                );

                /* =========================
                   SAVE CHUNK
                ========================= */

                console.log(
                    "SAVING CHUNK:",
                    i
                );

                await adminDb
                    .collection(
                        "globalFileChunks"
                    )
                    .add({
                        globalFileId:
                            globalFileRef.id,

                        topicId:
                            data?.topicId,

                        fileName:
                            data?.fileName,

                        chunkIndex:
                            i,

                        text:
                            currentChunk,

                        embedding:
                            embedding,

                        createdAt:
                            Date.now(),
                    });

                savedCount++;

                console.log(
                    "CHUNK SAVED:",
                    i
                );

                console.log(
                    "TOTAL SAVED:",
                    savedCount
                );

            } catch (error) {

                failedCount++;

                console.error(
                    "===================="
                );

                console.error(
                    "CHUNK FAILED:",
                    i
                );

                console.error(
                    "FAILED COUNT:",
                    failedCount
                );

                console.error(
                    error
                );
            }
        }

        /* =========================
           FINAL DEBUG
        ========================= */

        console.log(
            "========================"
        );

        console.log(
            "PROCESS COMPLETE"
        );

        console.log(
            "TOTAL CHUNKS:",
            chunks.length
        );

        console.log(
            "TOTAL SAVED:",
            savedCount
        );

        console.log(
            "TOTAL FAILED:",
            failedCount
        );

        /* =========================
           MARK APPROVED
        ========================= */

        await adminDb
            .collection(
                "globalFileRequests"
            )
            .doc(requestId)
            .update({
                approved: true,
            });

        console.log(
            "REQUEST APPROVED"
        );

        return NextResponse.json({
            success: true,

            totalChunks:
                chunks.length,

            savedChunks:
                savedCount,

            failedChunks:
                failedCount,
        });

    } catch (error) {

        console.error(
            "========================"
        );

        console.error(
            "APPROVE ERROR:"
        );

        console.error(
            error
        );

        return NextResponse.json(
            {
                error:
                    "Server error",
            },
            {
                status: 500,
            }
        );
    }
}