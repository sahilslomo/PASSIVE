import { NextResponse } from "next/server";

import { adminDb }
    from "@/lib/firebaseAdmin";

export async function POST(
    request: Request
) {

    try {

        const body =
            await request.json();

        const {
            topicId,
            fileName,
            extractedText,
        } = body;

        if (
            !topicId ||
            !fileName ||
            !extractedText
        ) {

            return NextResponse.json(
                {
                    error:
                        "Missing data",
                },
                {
                    status: 400,
                }
            );
        }

        await adminDb
            .collection(
                "globalFileRequests"
            )
            .add({
                topicId,

                fileName,

                extractedText,

                approved: false,

                createdAt:
                    Date.now(),
            });

        return NextResponse.json({
            success: true,
        });

    } catch (error) {

        console.error(error);

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