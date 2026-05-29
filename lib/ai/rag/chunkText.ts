type ChunkTextInput = {
    text: string;
    chunkSize?: number;
};

export function chunkText({
    text,
    chunkSize = 1200,
}: ChunkTextInput) {

    if (!text) {
        return [];
    }

    /* CLEAN TEXT */

    const cleaned =
        text
            .replace(/\r/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

    /* SPLIT BY PARAGRAPHS */

    const paragraphs =
        cleaned
            .split("\n\n")
            .map((p) => p.trim())
            .filter(Boolean);

    const chunks: string[] = [];

    let currentChunk = "";

    for (const paragraph of paragraphs) {

        /* LARGE PARAGRAPH */

        if (paragraph.length > chunkSize) {

            if (currentChunk) {

                chunks.push(
                    currentChunk.trim()
                );

                currentChunk = "";
            }

            for (
                let i = 0;
                i < paragraph.length;
                i += chunkSize
            ) {

                chunks.push(
                    paragraph.slice(
                        i,
                        i + chunkSize
                    )
                );
            }

            continue;
        }

        /* BUILD CHUNK */

        if (
            (
                currentChunk +
                "\n\n" +
                paragraph
            ).length > chunkSize
        ) {

            chunks.push(
                currentChunk.trim()
            );

            currentChunk = paragraph;

        } else {

            currentChunk +=
                (
                    currentChunk
                        ? "\n\n"
                        : ""
                ) + paragraph;
        }
    }

    /* FINAL PUSH */

    if (currentChunk) {

        chunks.push(
            currentChunk.trim()
        );
    }

    return chunks;
}