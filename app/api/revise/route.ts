import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { questions } = body;

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

Read all the following questions and answers carefully.

Create:
1. Concise revision notes
2. Key concepts
3. Easy-to-remember explanations
4. Important points for exams
5. Quick revision summary

Keep the response clean, structured, and student-friendly.

Questions and Answers:

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