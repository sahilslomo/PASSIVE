import { NextResponse } from "next/server";

import { adminDb }
    from "@/lib/firebaseAdmin";

import { chunkText }
    from "@/lib/chunkText";

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

        const data =
            requestDoc.data();

        /* =========================
           CHUNK TEXT
        ========================= */

        const chunks =
            chunkText(
                data?.extractedText || ""
            );

        console.log(
            "TOTAL CHUNKS:",
            chunks.length
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
                        data?.extractedText,

                    createdAt:
                        Date.now(),
                });

        console.log(
            "GLOBAL FILE CREATED:",
            globalFileRef.id
        );

        /* =========================
           SAVE CHUNKS + EMBEDDINGS
        ========================= */

        for (
            let i = 0;
            i < chunks.length;
            i++
        ) {

            console.log(
                "PROCESSING CHUNK:",
                i
            );

            const embeddingResponse =
                await openai.embeddings.create({
                    model:
                        "text-embedding-3-small",

                    input:
                        chunks[i],
                });

            const embedding =
                embeddingResponse
                    .data[0]
                    .embedding;

            console.log(
                "EMBEDDING LENGTH:",
                embedding.length
            );

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

                    chunkIndex: i,

                    text:
                        chunks[i],

                    embedding:
                        embedding,

                    createdAt:
                        Date.now(),
                });
        }

        console.log(
            "ALL CHUNKS SAVED"
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

        return NextResponse.json({
            success: true,
        });

    } catch (error) {

        console.error(
            "APPROVE ERROR:",
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