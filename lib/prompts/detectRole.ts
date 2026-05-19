type DetectRoleInput = {
  message: string;
};

export function detectRole({
  message,
}: DetectRoleInput) {

  const msg =
    message.toLowerCase();

  /* =========================
     ORAL / EXAM MODE
  ========================= */

  if (
    msg.includes("oral") ||
    msg.includes("mmd") ||
    msg.includes("exam") ||
    msg.includes("surveyor") ||
    msg.includes("interview") ||
    msg.includes("viva")
  ) {
    return "examiner";
  }

  /* =========================
     PSC / REGULATION MODE
  ========================= */

  if (
    msg.includes("psc") ||
    msg.includes("detention") ||
    msg.includes("solas") ||
    msg.includes("marpol") ||
    msg.includes("ism") ||
    msg.includes("mlc") ||
    msg.includes("class") ||
    msg.includes("regulation")
  ) {
    return "pscInspector";
  }

  /* =========================
     TROUBLESHOOTING MODE
  ========================= */

  if (
    msg.includes("fault") ||
    msg.includes("problem") ||
    msg.includes("trip") ||
    msg.includes("alarm") ||
    msg.includes("breakdown") ||
    msg.includes("troubleshoot") ||
    msg.includes("not working") ||
    msg.includes("high temperature") ||
    msg.includes("low pressure")
  ) {
    return "chiefEngineer";
  }

  /* =========================
     REVISION MODE
  ========================= */

  if (
    msg.includes("revise") ||
    msg.includes("revision") ||
    msg.includes("summary") ||
    msg.includes("notes") ||
    msg.includes("short notes") ||
    msg.includes("memory trick")
  ) {
    return "revisionCoach";
  }

  /* =========================
     DEFAULT MODE
  ========================= */

  return "mentor";
}