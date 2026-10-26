// Matches MAX_TAGS and MAX_TAG_LENGTH in app/api/profile/route.ts, which checks them again on save.
export const MAX_PROFILE_TAGS = 12;
export const MAX_PROFILE_TAG_LENGTH = 40;

export interface TagOptions {
  skills: string[];
  focusAreas: string[];
}

// 1.0.6: the list a person picks from is every value that profiles already use.
// "Bird ID" and "bird id" are one entry, shown with the spelling that most profiles use.
export function collectTagOptions(tagLists: Array<string[] | null>): string[] {
  const spellings = new Map<string, Map<string, number>>();
  for (const tags of tagLists) {
    for (const raw of tags ?? []) {
      const tag = raw.trim();
      if (!tag) continue;
      const key = tag.toLowerCase();
      const counts = spellings.get(key) ?? new Map<string, number>();
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      spellings.set(key, counts);
    }
  }
  return [...spellings.values()]
    .map((counts) => [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0])
    .sort((a, b) => a.localeCompare(b));
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      const substitution = previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1);
      current[column] = Math.min(previous[column] + 1, current[column - 1] + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length];
}

// 1.0.6 AT2: existing values that look like what the person typed. A value is similar when it
// contains the text, the text contains it, or it is within two edits (a typo such as "Wetlnds").
export function suggestSimilarTags(options: string[], typed: string, limit = 5): string[] {
  const needle = typed.trim().toLowerCase();
  if (!needle) return [];
  return options
    .filter((option) => {
      const candidate = option.toLowerCase();
      return candidate.includes(needle) || needle.includes(candidate) || editDistance(candidate, needle) <= 2;
    })
    .slice(0, limit);
}

// A typed value that matches an existing one ignoring case takes the existing spelling,
// so the same skill is never saved in two spellings.
export function matchExistingTag(options: string[], typed: string): string {
  const trimmed = typed.trim();
  return options.find((option) => option.toLowerCase() === trimmed.toLowerCase()) ?? trimmed;
}
