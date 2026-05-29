export type ConversationMode =
    | "oral"
    | "teaching"
    | "revision"
    | "troubleshooting"
    | "regulation"
    | "operational";

type DetectIntentInput = {
    message: string;
};

const INTENT_KEYWORDS = {

    oral: [
        "oral",
        "viva",
        "examiner",
        "mmd",
        "class 4",
        "class 2",
        "class 1",
        "meo",
        "interview",
        "surveyor asking",
        "how will surveyor ask",
        "pressure question",
        "cross questioning",
        "mock oral",
        "test me",
    ],

    revision: [
        "revision",
        "revise",
        "summary",
        "quick notes",
        "short notes",
        "memory trick",
        "important points",
        "flashcard",
        "last minute",
    ],

    troubleshooting: [
        "fault",
        "problem",
        "alarm",
        "trip",
        "failure",
        "breakdown",
        "not working",
        "high temperature",
        "low pressure",
        "cause",
        "troubleshoot",
        "why happened",
        "what will you do",
    ],

    regulation: [
        "solas",
        "marpol",
        "stcw",
        "ism",
        "isps",
        "mlc",
        "regulation",
        "convention",
        "imo",
        "psc",
        "port state",
        "compliance",
        "detention",
    ],

    operational: [
        "during watch",
        "onboard",
        "engine room",
        "cargo operation",
        "at sea",
        "in port",
        "watchkeeping",
        "operation sequence",
        "practical situation",
    ],
};

function matchesIntent(
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

export function detectIntent({
    message,
}: DetectIntentInput): ConversationMode {

    const msg =
        message.toLowerCase();

    if (
        matchesIntent(
            msg,
            INTENT_KEYWORDS.oral
        )
    ) {
        return "oral";
    }

    if (
        matchesIntent(
            msg,
            INTENT_KEYWORDS.revision
        )
    ) {
        return "revision";
    }

    if (
        matchesIntent(
            msg,
            INTENT_KEYWORDS.troubleshooting
        )
    ) {
        return "troubleshooting";
    }

    if (
        matchesIntent(
            msg,
            INTENT_KEYWORDS.regulation
        )
    ) {
        return "regulation";
    }

    if (
        matchesIntent(
            msg,
            INTENT_KEYWORDS.operational
        )
    ) {
        return "operational";
    }

    return "teaching";
}