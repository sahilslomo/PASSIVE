import { mentorPersona }
from "@/lib/ai/personas/mentorPersona";

import { examinerPersona }
from "@/lib/ai/personas/examinerPersona";

import { chiefEngineerPersona }
from "@/lib/ai/personas/chiefEngineerPersona";

import { surveyorPersona }
from "@/lib/ai/personas/surveyorPersona";

import { revisionCoachPersona }
from "@/lib/ai/personas/revisionCoachPersona";

export const activeRoles = {

    mentor:
        mentorPersona,

    examiner:
        examinerPersona,

    chiefEngineer:
        chiefEngineerPersona,

    surveyor:
        surveyorPersona,

    revisionCoach:
        revisionCoachPersona,
};