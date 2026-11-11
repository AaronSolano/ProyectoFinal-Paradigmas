export function resolveQuizSelection(ids: readonly string[], selectedId: string | null): string | null {
  if (selectedId && ids.includes(selectedId)) {
    return selectedId;
  }
  return ids[0] ?? null;
}
