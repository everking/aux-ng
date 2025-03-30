const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { OpenAI } = require('openai');

require('dotenv').config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const assetDir = path.resolve(__dirname, '../../../src/assets');
const dataDir = path.join(assetDir, 'data');
const outputDir = path.join(assetDir, 'index');
const outputFile = path.join(outputDir, 'article-embeddings.json');

// Helper to strip HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function generateEmbedding(text) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

// Main reusable method
async function generateEmbeddings(input = null) {
  const files = input
    ? [path.join(dataDir, `${input}.json`)]
    : glob.sync(`${dataDir}/*.json`);

  const newEmbeddings = [];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    const json = await fs.readJson(file);
    const fields = json.document?.fields || {};

    const id = fields.articleId?.stringValue || path.basename(file, '.json');
    const header = fields.header?.stringValue || '';
    const lastUpdated = fields.meta?.mapValue?.fields?.lastUpdated?.timestampValue || '';
    const body = fields.body?.stringValue || '';

    const plainBody = stripHtml(body);
    const fullText = [header, `Last updated: ${lastUpdated}`, plainBody].join('\n').trim();

    if (!fullText) {
      console.warn(`⚠️ Skipping empty content: ${id}`);
      continue;
    }

    const embedding = await generateEmbedding(fullText);
    newEmbeddings.push({ id, embedding });
    console.log(`✅ Embedded: ${id}`);
  }

  await fs.ensureDir(outputDir);

  let existing = [];
  if (await fs.pathExists(outputFile)) {
    existing = await fs.readJson(outputFile);
  }

  const indexMap = new Map(existing.map(e => [e.id, e]));
  for (const { id, embedding } of newEmbeddings) {
    indexMap.set(id, { id, embedding });
  }

  const merged = Array.from(indexMap.values());
  await fs.writeJson(outputFile, merged, { spaces: 2 });

  console.log(`🧠 Indexed ${newEmbeddings.length} articles. Total in index: ${merged.length}`);
}

// Run from CLI if invoked directly
if (require.main === module) {
  const arg = process.argv[2];
    generateEmbeddings(arg);
}

// Export for use as a module
module.exports = {
  generateEmbeddings,
};