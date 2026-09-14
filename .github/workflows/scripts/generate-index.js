const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch {
  /* optional for GitHub Actions, which injects XAI_API_KEY */
}

const assetDir = path.resolve(__dirname, '../../../src/assets');
const articlesDir = path.join(assetDir, 'data', 'articles');
const outputDir = path.join(assetDir, 'index');
const outputFile = path.join(outputDir, 'article-embeddings.json');
const XAI_EMBEDDINGS_URL = 'https://api.x.ai/v1/embeddings';
const XAI_EMBEDDING_MODEL = 'v1';

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(dir, name));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function generateEmbedding(text) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not set');
  }

  const response = await fetch(XAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: XAI_EMBEDDING_MODEL,
      input: `passage: ${text}`,
      encoding_format: 'float'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`xAI embeddings error: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const embedding = json?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('xAI embeddings response did not include a vector');
  }
  return embedding;
}

async function generateEmbeddings(input = null) {
  const files = input
    ? [path.join(articlesDir, `${input}.json`)]
    : listJsonFiles(articlesDir);

  const newEmbeddings = [];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn(`File not found: ${file}`);
      continue;
    }

    const json = readJson(file);
    const fields = json.document?.fields || {};
    const id = fields.articleId?.stringValue || path.basename(file, '.json');
    if (fields.deleted?.booleanValue) {
      console.log(`Skipping deleted: ${id}`);
      continue;
    }

    const header = fields.header?.stringValue || '';
    const lastUpdated = fields.meta?.mapValue?.fields?.lastUpdated?.timestampValue || '';
    const body = fields.body?.stringValue || '';
    const fullText = [header, `Last updated: ${lastUpdated}`, stripHtml(body)].join('\n').trim();
    if (!fullText) {
      console.warn(`Skipping empty content: ${id}`);
      continue;
    }

    const embedding = await generateEmbedding(fullText);
    newEmbeddings.push({ id, embedding, lastUpdated });
    console.log(`Embedded: ${id}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  let existing = [];
  if (fs.existsSync(outputFile)) {
    existing = readJson(outputFile);
  }

  const indexMap = new Map();
  if (input) {
    existing.forEach((entry) => indexMap.set(entry.id, entry));
  }
  newEmbeddings.forEach((entry) => indexMap.set(entry.id, entry));

  const liveIds = new Set(listJsonFiles(articlesDir).map((file) => path.basename(file, '.json')));
  for (const id of Array.from(indexMap.keys())) {
    if (!liveIds.has(id)) {
      indexMap.delete(id);
      console.log(`Removed stale embedding: ${id}`);
    }
  }

  const merged = Array.from(indexMap.values()).map(({ id, embedding }) => ({ id, embedding }));
  fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2), 'utf8');
  console.log(`Indexed ${newEmbeddings.length} documents with xAI. Total in index: ${merged.length}`);
}

if (require.main === module) {
  generateEmbeddings(process.argv[2]).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  generateEmbeddings
};
