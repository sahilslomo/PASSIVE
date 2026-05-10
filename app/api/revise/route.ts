import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const body = await req.json();

        const { questions, transcript } = body;

        const formattedQuestions = questions
            .map(
                (q: any, index: number) =>
                    `Question ${index + 1}:
${q.question || q.q}

Answer:
${q.answer || q.a}`
            )
            .join("\n\n");

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

        const completion =
            await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            });

        return NextResponse.json({
            success: true,
            revision:
                completion.choices[0].message.content,
        });

    } catch (error) {

        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error:
                    "Failed to generate revision",
            },
            {
                status: 500,
            }
        );
    }
}