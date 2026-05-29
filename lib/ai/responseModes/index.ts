/* =========================
   EXAMINER
========================= */

export { examinerMode }
    from "./examinerMode";

/* =========================
   TEACHER
========================= */

export { chiefEngineerMode }
    from "./chiefEngineerMode";

/* =========================
   SURVEYOR
========================= */

export { surveyorMode }
    from "./surveyorMode";


/* =========================
   MENTOR
========================= */

export { mentorMode }
    from "./mentorMode";


/* =========================
   REVISION
========================= */

export { revisionMode }
    from "./revisionMode";

/* =========================
   IMPORT ALL
========================= */

import { examinerMode }
    from "./examinerMode";

import { chiefEngineerMode }
    from "./chiefEngineerMode";

import { surveyorMode }
    from "./surveyorMode";

import { revisionMode }
    from "./revisionMode";

import { mentorMode }
    from "./mentorMode";

/* =========================
   RESPONSE MODES
========================= */

export const responseModes = {

    examiner:
        examinerMode,

    chiefEngineer:
        chiefEngineerMode,

    surveyor:
        surveyorMode,

    revision:
        revisionMode,

    mentor:
        mentorMode,
};