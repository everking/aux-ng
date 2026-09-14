export const stripHtml = (html?: string): string => {
  if (!html) {
    return '';
  }
  const withBreaks = html
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre|section|header|footer)>/gi, ' ')
    .replace(/<(p|div|li|h[1-6]|tr|blockquote|pre|section|header|footer)(\s[^>]*)?>/gi, ' ');
  const div = document.createElement('div');
  div.innerHTML = withBreaks;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

export function normalizeTags(tags?: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags || []) {
    const tag = raw.trim();
    if (!tag) {
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(tag);
  }
  return result;
}

export function readFirestoreStringArray(
  value?: { arrayValue?: { values?: { stringValue?: string }[] } }
): string[] {
  return normalizeTags((value?.arrayValue?.values || []).map((item) => item.stringValue || ''));
}

export function toFirestoreStringArray(tags: string[]) {
  return {
    arrayValue: {
      values: normalizeTags(tags).map((tag) => ({ stringValue: tag }))
    }
  };
}
