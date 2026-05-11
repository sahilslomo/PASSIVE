import OpenAI from "openai";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {

  try {

    const body = await req.json();

    const {
      questions,
      transcript,
      topicId,
    } = body;

    /* =========================
       CACHE CHECK
    ========================= */

    const cacheRef = doc(
      db,
      "revisionCache",
      topicId
    );

    const cacheSnap =
      await getDoc(cacheRef);

    if (cacheSnap.exists()) {

      return new Response(
        cacheSnap.data().revision,
        {
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
          },
        }
      );
    }

    /* =========================
       FORMAT QUESTIONS
    ========================= */

    const formattedQuestions =
      questions
        .map(
          (q: any, index: number) =>
            `Question ${index + 1}:

${q.question || q.q}

Answer:

${q.answer || q.a}`
        )
        .join("\n\n");

    /* =========================
       PROMPT
    ========================= */

    const prompt = `
You are an expert AI revision assistant.

Use ALL provided learning context to generate the best possible revision notes.

You are given:
1. Transcript
2. Topic summary
3. Notes
4. Questions and answers

Generate:
- comprehensive revision notes
- key concepts
- concise explanations
- memory tricks
- exam-focused preparation
- quick revision bullets
- structured understanding

TRANSCRIPT:
${transcript}

QUESTIONS:
${formattedQuestions}
`;

    /* =========================
       OPENAI STREAM
    ========================= */

    const stream =
      await openai.chat.completions.create({
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

    const readableStream =
      new ReadableStream({

        async start(controller) {

          let fullText = "";

          for await (const chunk of stream) {

            const text =
              chunk.choices[0]?.delta?.content || "";

            fullText += text;

            controller.enqueue(
              encoder.encode(text)
            );
          }

          /* =========================
             SAVE CACHE
          ========================= */

          await setDoc(cacheRef, {
            revision: fullText,
            createdAt: Date.now(),
          });

          controller.close();
        },
      });

    return new Response(readableStream, {
      headers: {
        "Content-Type":
          "text/plain; charset=utf-8",
      },
    });

  } catch (error) {

    console.error(error);

    return new Response(
      "Failed to generate revision",
      {
        status: 500,
      }
    );
  }
}