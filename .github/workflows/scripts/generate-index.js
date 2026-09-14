const fs = require('fs');
const path = require('path');

try {
  require('dotenv').config();
} catch {
  /* optional for GitHub Actions */
}

const { embedWithFallback } = require('../../../functions/embed-providers');

const assetDir = path.resolve(__dirname, '../../../src/assets');
const articlesDir = path.join(assetDir, 'data', 'articles');
const outputDir = path.join(assetDir, 'index');
const outputFile = path.join(outputDir, 'article-embeddings.json');

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

function readIndex(file) {
  if (!fs.existsSync(file)) {
    return { provider: '', model: '', embeddings: [] };
  }
  const json = readJson(file);
  if (Array.isArray(json)) {
    return { provider: 'openai', model: 'text-embedding-3-small', embeddings: json };
  }
  return {
    provider: json.provider || '',
    model: json.model || '',
    embeddings: Array.isArray(json.embeddings) ? json.embeddings : []
  };
}

function describeKey(name, value) {
  if (!value) {
    return `${name}: not set`;
  }
  return `${name}: set len=${value.length} last4=${value.slice(-4)}`;
}

async function generateEmbeddings(input = null) {
  console.log(describeKey('XAI_API_KEY', process.env.XAI_API_KEY));
  console.log(describeKey('OPENAI_API_KEY', process.env.OPENAI_API_KEY));

  const files = input
    ? [path.join(articlesDir, `${input}.json`)]
    : listJsonFiles(articlesDir);

  const newEmbeddings = [];
  let provider = '';
  let model = '';

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

    const result = await embedWithFallback(fullText, 'passage');
    provider = result.provider;
    model = result.model;
    newEmbeddings.push({ id, embedding: result.embedding, lastUpdated });
    console.log(`Embedded (${result.provider}/${result.model}): ${id}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const existing = readIndex(outputFile);
  const indexMap = new Map();
  const sameSpace = input && existing.provider && provider && existing.provider === provider;
  if (sameSpace) {
    existing.embeddings.forEach((entry) => indexMap.set(entry.id, entry));
  }
  newEmbeddings.forEach((entry) => indexMap.set(entry.id, entry));

  const liveIds = new Set(listJsonFiles(articlesDir).map((file) => path.basename(file, '.json')));
  for (const id of Array.from(indexMap.keys())) {
    if (!liveIds.has(id)) {
      indexMap.delete(id);
      console.log(`Removed stale embedding: ${id}`);
    }
  }

  const embeddings = Array.from(indexMap.values()).map(({ id, embedding }) => ({ id, embedding }));
  fs.writeFileSync(outputFile, JSON.stringify({
    provider: provider || existing.provider || 'unknown',
    model: model || existing.model || '',
    embeddings
  }, null, 2), 'utf8');
  console.log(`Indexed ${newEmbeddings.length} documents with ${provider || 'none'}. Total in index: ${embeddings.length}`);
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
