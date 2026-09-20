import { mentionLabel, splitMentionText, type MentionPerson } from "@/discussions/model/mentions";

export function MentionedPlainText({
  text,
  people,
}: {
  text: string;
  people: MentionPerson[];
}) {
  const parts = splitMentionText(text, people);
  if (parts.length === 0) return null;
  return (
    <p className="mt-2 whitespace-pre-wrap text-[14.5px] leading-relaxed text-[var(--ink)]">
      {parts.map((part, index) =>
        part.kind === "mention" ? (
          <span key={`${part.userId}-${index}`} className="cw-mention">
            {mentionLabel(part.name)}
          </span>
        ) : (
          <span key={`t-${index}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}
