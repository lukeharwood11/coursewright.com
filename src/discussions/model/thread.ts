export type NestedMessage<T extends { id: number; parentId: number | null; createdAt: string }> =
  T & { replies: T[] };

export function nestDiscussionMessages<
  T extends { id: number; parentId: number | null; createdAt: string },
>(messages: T[]): Array<NestedMessage<T>> {
  const roots = messages
    .filter((message) => message.parentId == null)
    .sort(compareMessages);

  const repliesByParent = new Map<number, T[]>();
  for (const message of messages) {
    if (message.parentId == null) continue;
    const list = repliesByParent.get(message.parentId) ?? [];
    list.push(message);
    repliesByParent.set(message.parentId, list);
  }

  return roots.map((root) => ({
    ...root,
    replies: (repliesByParent.get(root.id) ?? []).sort(compareMessages),
  }));
}

function compareMessages(a: { createdAt: string; id: number }, b: { createdAt: string; id: number }) {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id - b.id;
}

export function isNearScrollBottom(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  thresholdPx = 80,
): boolean {
  return scrollHeight - scrollTop - clientHeight <= thresholdPx;
}
