import OpenAI from "openai";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/* =========================
   TYPES
========================= */

type Transcript = {
    id?: string;
    text?: string;
    transcript?: string;
    content?: string;
};

type Question = {
    id?: string;
    question?: string;
    q?: string;
    answer?: string;
    a?: string;
};

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const {
            questions = [],
            transcript,
            transcripts = [],
            uploadedFiles = [],
            useGlobalFiles = false,
            topicId,
        } = body;

        let globalFiles: any[] = [];

        if (useGlobalFiles) {

            const globalFilesSnap =
                await adminDb
                    .collection("globalFiles")
                    .where(
                        "topicId",
                        "==",
                        topicId
                    )
                    .get();

            globalFiles =
                globalFilesSnap.docs.map(
                    (doc) => doc.data()
                );
        }

        console.log(
            "🌍 GLOBAL FILES:",
            globalFiles.length
        );

        /* =========================
           BASIC DEBUG
        ========================= */

        console.log("🚀 REVISION API START");
        console.log("topicId:", topicId);
        console.log("questions count:", questions.length);
        console.log("raw transcripts count:", transcripts.length);

        /* =========================
           NORMALIZE TRANSCRIPTS
        ========================= */

        const normalizedTranscripts = (transcripts as Transcript[])
            .map((t) => ({
                id: t?.id || "",
                text: t?.text || t?.transcript || t?.content || "",
            }))
            .filter((t) => t.id || t.text);

        /* =========================
           DEBUG: NORMALISED TRANSCRIPTS
        ========================= */

        console.log(
            "📦 NORMALISED TRANSCRIPTS:",
            normalizedTranscripts
        );

        /* =========================
           COMBINE TRANSCRIPTS
        ========================= */

        const combinedTranscript = normalizedTranscripts.length
            ? normalizedTranscripts
                .map((t) => t.text)
                .filter(Boolean)
                .join("\n\n")
            : transcript || "";

        /* =========================
           DEBUG: TRANSCRIPT LENGTH
        ========================= */

        console.log(
            "📏 COMBINED TRANSCRIPT LENGTH:",
            combinedTranscript.length
        );

        /* =========================
           COMBINE FILE TEXT
        ========================= */

        const uploadedFilesText =
            uploadedFiles
                .map(
                    (file: any) =>
                        `LOCAL FILE: ${file.name}\n\n${file.extractedText}`
                )
                .join("\n\n");

        const globalFilesText =
            globalFiles
                .map(
                    (file: any) =>
                        `GLOBAL FILE: ${file.fileName}\n\n${file.extractedText}`
                )
                .join("\n\n");

        const combinedFilesText =
            `
${uploadedFilesText}

${globalFilesText}
`;


        /* =========================
           FORMAT QUESTIONS
        ========================= */

        const formattedQuestions = (questions as Question[])
            .map(
                (q, i) =>
                    `Q${i + 1}:\n${q.question || q.q}\nA:\n${q.answer || q.a}`
            )
            .join("\n\n");

        /* =========================
           CACHE KEY
        ========================= */

        const transcriptHash = crypto
            .createHash("md5")
            .update(
                JSON.stringify(
                    (normalizedTranscripts || [])
                        .map((t) => ({
                            id: t.id,
                            text: t.text?.trim() || ""
                        }))
                        .sort((a, b) => a.id.localeCompare(b.id))
                )
            )
            .digest("hex");

        const questionHash = crypto
            .createHash("md5")
            .update(
                JSON.stringify(
                    (questions as Question[])
                        .map((q) => q.id || q.q)
                        .sort()
                )
            )
            .digest("hex");

        const cacheKey = `${topicId}_${transcriptHash}_${questionHash}_${uploadedFiles.length}_${useGlobalFiles}`;

        console.log("🧠 CACHE KEY:", cacheKey);

        const cacheRef = adminDb.collection("revisionCache").doc(cacheKey);
        const cacheSnap = await cacheRef.get();

        if (cacheSnap.exists) {
            console.log("🚀 CACHE HIT");
            return new Response(cacheSnap.data()?.revision, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                },
            });
        }

        console.log("🔥 CACHE MISS - calling OpenAI");

        /* =========================
           PROMPT
        ========================= */

        const prompt = `
You are Navik AI Revision Assistant.

Generate revision notes ONLY using the learning material provided below.

Important:
- Do NOT assume missing knowledge
- Use ONLY the supplied sources
- If some sections are missing, continue with available material
- Prioritize clarity and exam preparation

Your tasks:
- create structured revision notes
- explain difficult concepts simply
- generate quick revision bullets
- highlight important facts
- create memory tricks where possible
- summarize efficiently
- improve retention

TRANSCRIPTS:
${combinedTranscript || "No transcripts provided."}

QUESTIONS AND ANSWERS:
${formattedQuestions || "No questions provided."}

UPLOADED FILES:
${combinedFilesText || "No uploaded files provided."}

Generate smart structured revision notes.
`;

        /* =========================
           DEBUG: PROMPT SIZE
        ========================= */

        console.log("📤 PROMPT SIZE:", prompt.length);

        /* =========================
           OPENAI STREAM
        ========================= */

        const stream = await openai.chat.completions.create({
            model: "gpt-4.1-nano-2025-04-14",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            stream: true,
        });

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                let fullText = "";

                for await (const chunk of stream) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    fullText += text;

                    controller.enqueue(encoder.encode(text));
                }

                /* =========================
                   SAVE CACHE
                ========================= */

                await cacheRef.set({
                    revision: fullText,
                    createdAt: Date.now(),
                });

                console.log("💾 CACHE SAVED (REVISION STORED)");

                controller.close();
            },
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });

    } catch (error) {
        console.error("❌ REVISION ERROR:", error);

        return new Response("Failed to generate revision", {
            status: 500,
        });
    }
}