import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { chunkText } from "./chunkText";

export async function buildKnowledge(
  transcriptId: string,
  topicId: string,
  transcriptText: string
) {
  const chunks = chunkText({
    text: transcriptText,
  });

  for (const chunk of chunks) {
    await addDoc(
      collection(db, "transcriptChunks"),
      {
        transcriptId,
        topicId,

        text: chunk,

        embedding: [],

        createdAt: Date.now(),
      }
    );
  }

  return chunks.length;
}