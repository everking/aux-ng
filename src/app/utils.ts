export const stripHtml = (html?: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html? html : '';
  return div.textContent || div.innerText || '';
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
