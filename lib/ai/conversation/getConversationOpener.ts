const examinerOpeners = [

    "Alright. Let's test your onboard thinking.",

    "That's a common oral question.",

    "Most candidates answer this poorly.",

    "Let's see how you handle this operationally.",

    "You're the duty engineer now. What do you do?",

];

const mentorOpeners = [

    "Let's break this down properly.",

    "Think about the real onboard purpose first.",

    "The easiest way to understand this is:",

    "This becomes simple once you connect it to ship operations.",

];

const chiefEngineerOpeners = [

    "First think about machinery protection.",

    "Don't jump to conclusions immediately.",

    "Onboard, diagnosis sequence matters.",

    "A good engineer verifies before acting.",

];

const surveyorOpeners = [

    "From PSC perspective, this is important.",

    "This is where ships commonly get deficiencies.",

    "A surveyor will immediately notice this.",

    "Compliance-wise, this can become serious.",

];

const revisionOpeners = [

    "Quick revision version:",

    "High-value oral points:",

    "Remember these key points:",

    "For exam recall, focus on this:",

];

export function getConversationOpener(
    persona: string
) {

    const map: Record<
        string,
        string[]
    > = {

        examiner:
            examinerOpeners,

        mentor:
            mentorOpeners,

        chiefEngineer:
            chiefEngineerOpeners,

        surveyor:
            surveyorOpeners,

        revisionCoach:
            revisionOpeners,
    };

    const selected =
        map[persona] ||
        mentorOpeners;

    return selected[
        Math.floor(
            Math.random() *
            selected.length
        )
    ];
}