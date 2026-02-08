export function createId(prefix = "id"): string {
  const seed = Math.random().toString(36).slice(2, 8);
  const timestamp = Date.now().toString(36);
  return `${prefix}-${timestamp}-${seed}`;
}
