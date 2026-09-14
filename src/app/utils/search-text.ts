export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

export function keywordScore(query: string, text: string): number {
  const haystack = text.toLowerCase();
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || !haystack) {
    return 0;
  }
  let score = 0;
  if (haystack.includes(trimmed)) {
    score += 5;
  }
  tokenize(trimmed).forEach((token) => {
    if (haystack.includes(token)) {
      score += 1;
    }
  });
  return score;
}

export function tfidfScore(query: string, vector: { term: string; tfidf: number }[]): number {
  const tokens = tokenize(query);
  if (!tokens.length || !vector?.length) {
    return 0;
  }
  let score = 0;
  vector.forEach(({ term, tfidf }) => {
    if (tokens.some((token) => term.includes(token) || token.includes(term))) {
      score += tfidf;
    }
  });
  return score;
}
