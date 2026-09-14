const { embedWithFallback } = require('./embed-providers');

/**
 * POST { "input": "search text" }
 * Tries xAI embeddings, then OpenAI, and returns an OpenAI-compatible payload
 * plus provider/model so the client can avoid mixing vector spaces.
 */
exports.generateEmbedding = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' });
    return;
  }

  const input = typeof req.body === 'string'
    ? req.body
    : (req.body && req.body.input);

  if (!input || typeof input !== 'string') {
    res.status(400).json({ error: 'Missing input' });
    return;
  }

  try {
    const result = await embedWithFallback(input, 'query');
    res.status(200).json({
      provider: result.provider,
      model: result.model,
      object: 'list',
      data: [
        {
          object: 'embedding',
          index: 0,
          embedding: result.embedding
        }
      ]
    });
  } catch (error) {
    console.error('generateEmbedding failed', error);
    res.status(503).json({ error: error.message || 'Embedding request failed' });
  }
};
