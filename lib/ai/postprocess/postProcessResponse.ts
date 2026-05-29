import { humanizers }
from "@/lib/ai/conversation/humanizers";

import { conversationPatterns }
from "@/lib/ai/conversation/conversationPatterns";

type PostProcessInput = {
    response: string;
};

export function postProcessResponse({
    response,
}: PostProcessInput) {

    if (!response) {
        return response;
    }

    const randomHumanizer =
        humanizers[
            Math.floor(
                Math.random() *
                humanizers.length
            )
        ];

    const randomPressure =
        conversationPatterns.examinerPressure[
            Math.floor(
                Math.random() *
                conversationPatterns.examinerPressure.length
            )
        ];

    const endings = [

        "That's the onboard reality.",

        "And that is exactly why surveyors focus heavily on this area.",

        "Most candidates stop at theory. Don't make that mistake.",

        "This becomes very important during drydock and ESP inspections.",

        "A chief engineer immediately thinks about long-term structural risk here.",

    ];

    const randomEnding =
        endings[
            Math.floor(
                Math.random() *
                endings.length
            )
        ];

    return `

${randomHumanizer}

${response.trim()}

${randomPressure}

${randomEnding}

`;
}