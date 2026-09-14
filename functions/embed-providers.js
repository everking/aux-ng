const XAI_URL = 'https://api.x.ai/v1/embeddings';
const XAI_MODEL = 'v1';
const OPENAI_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_MODEL = 'text-embedding-3-small';

async function postEmbedding(url, apiKey, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${url} ${response.status} ${text}`);
  }
  const json = JSON.parse(text);
  const embedding = json?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error(`${url} response did not include a vector`);
  }
  return { embedding, raw: json };
}

async function embedWithFallback(text, kind = 'query') {
  const errors = [];
  const prefixed = kind === 'passage' ? `passage: ${text}` : `query: ${text}`;

  if (process.env.XAI_API_KEY) {
    try {
      const result = await postEmbedding(XAI_URL, process.env.XAI_API_KEY, {
        model: XAI_MODEL,
        input: prefixed,
        encoding_format: 'float'
      });
      return {
        provider: 'xai',
        model: XAI_MODEL,
        embedding: result.embedding,
        raw: result.raw
      };
    } catch (error) {
      errors.push(`xai: ${error.message}`);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await postEmbedding(OPENAI_URL, process.env.OPENAI_API_KEY, {
        model: OPENAI_MODEL,
        input: text
      });
      return {
        provider: 'openai',
        model: OPENAI_MODEL,
        embedding: result.embedding,
        raw: result.raw
      };
    } catch (error) {
      errors.push(`openai: ${error.message}`);
    }
  }

  const detail = errors.join(' | ') || 'No embedding provider configured';
  throw new Error(detail);
}

module.exports = {
  embedWithFallback,
  XAI_MODEL,
  OPENAI_MODEL
};
