export type QuizKeyPrintMode = "worksheet" | "key" | "both";

export function defaultQuizKeyPrintMode(canShowKey: boolean): QuizKeyPrintMode {
  return canShowKey ? "key" : "worksheet";
}

export function parseQuizKeyPrintMode(raw: string | null | undefined): QuizKeyPrintMode | null {
  if (raw === "worksheet" || raw === "key" || raw === "both") return raw;
  return null;
}

/** Single-quiz print route: `quizKey=worksheet|key|both` */
export function parseQuizPrintKeySearch(search: string): QuizKeyPrintMode | null {
  const params = new URLSearchParams(search);
  return parseQuizKeyPrintMode(params.get("quizKey"));
}

export function buildQuizPrintKeySearch(mode: QuizKeyPrintMode | null): string {
  if (!mode) return "";
  const params = new URLSearchParams();
  params.set("quizKey", mode);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Multi-quiz: `qid=12=key,15=both` */
export function parseQuizKeyModeMap(raw: string | null): Map<number, QuizKeyPrintMode> {
  const map = new Map<number, QuizKeyPrintMode>();
  if (!raw) return map;
  for (const piece of raw.split(",")) {
    const trimmed = piece.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const id = Number(trimmed.slice(0, eq));
    const mode = parseQuizKeyPrintMode(trimmed.slice(eq + 1));
    if (Number.isFinite(id) && id > 0 && mode) map.set(id, mode);
  }
  return map;
}

export function serializeQuizKeyModeMap(map: Map<number, QuizKeyPrintMode>): string | null {
  if (map.size === 0) return null;
  const parts = [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([id, mode]) => `${id}=${mode}`);
  return parts.join(",");
}

export function quizKeyModeForQuiz(
  quizId: number,
  overrides: Map<number, QuizKeyPrintMode>,
  canShowKey: boolean,
): QuizKeyPrintMode {
  const override = overrides.get(quizId);
  if (override && canShowKey) return override;
  return defaultQuizKeyPrintMode(canShowKey);
}

export function includeAnswerKeyForMode(mode: QuizKeyPrintMode): boolean {
  return mode === "key" || mode === "both";
}
