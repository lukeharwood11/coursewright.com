export type CreateMaterialInput = {
  title: string;
  description: string;
  kind: "page" | "link" | "file";
  url: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
};

export type CreateMaterialParse =
  | { ok: true; value: CreateMaterialInput }
  | { ok: false; error: string };

export function validateMaterialFields(raw: {
  title: string;
  description: string;
  kind: "page" | "link" | "file";
  url: string;
  scheduledDate: string;
  dueDate: string;
}): CreateMaterialParse {
  const title = raw.title.trim();
  if (!title) return { ok: false, error: "Give this material a title." };

  const url = raw.url.trim();
  if (raw.kind === "link") {
    if (!url) return { ok: false, error: "Add a web address for this link." };
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "The link needs to start with https://." };
      }
    } catch {
      return { ok: false, error: "That doesn’t look like a web address." };
    }
  }

  return {
    ok: true,
    value: {
      title,
      description: raw.description.trim(),
      kind: raw.kind,
      url: raw.kind === "link" ? url : null,
      scheduledDate: raw.scheduledDate.trim() || null,
      dueDate: raw.dueDate.trim() || null,
    },
  };
}
