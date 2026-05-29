type BuildConversationMemoryInput = {
    messages: {
        role: string;
        content: string;
    }[];
};

export function buildConversationMemory({
    messages,
}: BuildConversationMemoryInput) {

    if (!messages?.length) {
        return "";
    }

    const recentMessages =
        messages.slice(-8);

    return recentMessages
        .map((msg) => {

            const role =
                msg.role === "assistant"
                    ? "NAVIK"
                    : "USER";

            return `
${role}:
${msg.content.slice(0, 1200)}
`;
        })
        .join("\n");
}