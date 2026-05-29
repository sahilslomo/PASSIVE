export type PersonaType =
    | "mentor"
    | "examiner"
    | "chiefEngineer"
    | "surveyor"
    | "revisionCoach";

type DetectPersonaInput = {
    message: string;
};

const PERSONA_KEYWORDS = {

    examiner: [
        "oral",
        "viva",
        "mmd",
        "exam",
        "interview",
        "meo",
        "class 4",
        "class 2",
        "class 1",
        "test me",
        "cross questioning",
        "mock oral",
        "surveyor asking",
    ],

    surveyor: [
        "psc",
        "solas",
        "marpol",
        "ism",
        "isps",
        "mlc",
        "regulation",
        "compliance",
        "detention",
        "port state",
        "class deficiency",
    ],

    chiefEngineer: [
        "fault",
        "alarm",
        "trip",
        "failure",
        "breakdown",
        "not working",
        "high temperature",
        "low pressure",
        "troubleshoot",
        "problem",
        "blackout",
        "emergency",
    ],

    revisionCoach: [
        "revision",
        "revise",
        "summary",
        "quick notes",
        "memory trick",
        "flashcard",
        "important points",
        "last minute preparation",
    ],
};

function matchesPersona(
    msg: string,
    keywords: string[]
) {
    return keywords.some(
        (keyword) =>
            msg.includes(
                keyword.toLowerCase()
            )
    );
}

export function detectPersona({
    message,
}: DetectPersonaInput): PersonaType {

    const msg =
        message.toLowerCase();

    if (
        matchesPersona(
            msg,
            PERSONA_KEYWORDS.examiner
        )
    ) {
        return "examiner";
    }

    if (
        matchesPersona(
            msg,
            PERSONA_KEYWORDS.surveyor
        )
    ) {
        return "surveyor";
    }

    if (
        matchesPersona(
            msg,
            PERSONA_KEYWORDS.chiefEngineer
        )
    ) {
        return "chiefEngineer";
    }

    if (
        matchesPersona(
            msg,
            PERSONA_KEYWORDS.revisionCoach
        )
    ) {
        return "revisionCoach";
    }

    return "mentor";
}