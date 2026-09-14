const XAI_URL = 'https://api.x.ai/v1/embeddings';
const XAI_MODEL = 'v1';
const OPENAI_URL = 'https://api.openai.com/v1/embeddings';
const OPENAI_MODEL = 'text-embedding-3-small';

function selectedProvider() {
  const raw = String(process.env.EMBEDDINGS_API || 'OPEN_AI')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');
  if (raw === 'X_AI' || raw === 'XAI') {
    return 'X_AI';
  }
  if (raw === 'OPEN_AI' || raw === 'OPENAI') {
    return 'OPEN_AI';
  }
  throw new Error(`Unknown EMBEDDINGS_API="${process.env.EMBEDDINGS_API}". Use X_AI or OPEN_AI.`);
}

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

async function embedText(text, kind = 'query') {
  const provider = selectedProvider();
  if (provider === 'X_AI') {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('EMBEDDINGS_API=X_AI but XAI_API_KEY is not set');
    }
    const prefixed = kind === 'passage' ? `passage: ${text}` : `query: ${text}`;
    const result = await postEmbedding(XAI_URL, apiKey, {
      model: XAI_MODEL,
      input: prefixed,
      encoding_format: 'float'
    });
    return { provider: 'xai', model: XAI_MODEL, embedding: result.embedding, raw: result.raw };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('EMBEDDINGS_API=OPEN_AI but OPENAI_API_KEY is not set');
  }
  const result = await postEmbedding(OPENAI_URL, apiKey, {
    model: OPENAI_MODEL,
    input: text
  });
  return { provider: 'openai', model: OPENAI_MODEL, embedding: result.embedding, raw: result.raw };
}

function providerFolder(api = selectedProvider()) {
  return api === 'X_AI' ? 'x-ai' : 'open-ai';
}

module.exports = {
  embedText,
  selectedProvider,
  providerFolder,
  XAI_MODEL,
  OPENAI_MODEL
};
