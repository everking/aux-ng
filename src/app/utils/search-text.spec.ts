import { keywordScore, tfidfScore, tokenize } from './search-text';

describe('search text', () => {
  it('tokenizes a query', () => {
    expect(tokenize('Recollection nights')).toEqual(['recollection', 'nights']);
  });

  it('scores a recollection title', () => {
    expect(keywordScore('Recollection', 'Evenings of Recollection (Men)')).toBeGreaterThan(0);
  });

  it('scores tf-idf terms for recollection', () => {
    const score = tfidfScore('Recollection', [{ term: 'recollections', tfidf: 4 }]);
    expect(score).toBeGreaterThan(0);
  });
});
