const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const {
  updateCategoryPlacement,
  removeArticleFromCategories,
  setCategoryArticles
} = require(path.resolve(__dirname, 'sync-category'));

const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
const firestoreBase = 'https://firestore.googleapis.com/v1';
const dataFolder = 'src/assets/data/articles';
const eventsIndexPath = path.join(dataFolder, '../events.json');
const embeddingsPath = path.join(dataFolder, '../../index/article-embeddings.json');
const updateFilePath = path.join(dataFolder, '../update.json'); // One level up

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: 'firebase-key.json',
    scopes: ['https://www.googleapis.com/auth/datastore']
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function runQuery(token, structuredQuery) {
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ structuredQuery })
  });

  if (!response.ok) {
    throw new Error(`Error fetching Firestore data: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function deleteFirestoreDocument(documentName, token) {
  const response = await fetch(`${firestoreBase}/${documentName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.ok || response.status === 404) {
    console.log(`Deleted Firestore document: ${documentName}`);
    return;
  }

  throw new Error(`Failed to delete ${documentName}: ${response.status} ${response.statusText}`);
}

function removeEmbedding(articleId) {
  if (!fs.existsSync(embeddingsPath)) {
    console.warn(`No embeddings file at ${embeddingsPath}`);
    return;
  }

  const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
  if (!Array.isArray(embeddings)) {
    console.warn('Embeddings file is not an array; skipping embedding removal.');
    return;
  }

  const next = embeddings.filter((entry) => entry?.id !== articleId);
  if (next.length === embeddings.length) {
    console.log(`No embedding found for "${articleId}"`);
    return;
  }

  fs.writeFileSync(embeddingsPath, JSON.stringify(next, null, 2), 'utf8');
  console.log(`Removed embedding for "${articleId}"`);
}

async function purgeDeletedArticle({ articleId, documentName, filePath, token }) {
  await deleteFirestoreDocument(documentName, token);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Removed deleted: ${filePath}`);
  }

  removeArticleFromCategories(articleId);
  removeEmbedding(articleId);
}

async function saveDocuments(entries, token) {
  let saved = 0;

  for (const [index, entry] of entries.entries()) {
    if (!entry.document) {
      continue;
    }

    const documentName = entry.document.name;
    if (!entry.document.fields?.articleId) {
      console.warn(`Skipping entry ${index} ${documentName} due to missing articleId.`);
      continue;
    }

    const articleId = entry.document.fields.articleId.stringValue;
    const filePath = path.join(dataFolder, `${articleId}.json`);

    if (entry.document.fields.deleted?.booleanValue) {
      await purgeDeletedArticle({ articleId, documentName, filePath, token });
      continue;
    }

    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
    console.log(`Saved: ${filePath}`);
    updateCategoryPlacement(entry.document);
    saved += 1;
  }

  return saved;
}

function writeEventsIndex(eventIds) {
  const uniqueIds = [...new Set(eventIds.filter(Boolean))];
  fs.writeFileSync(eventsIndexPath, JSON.stringify(uniqueIds, null, 2), 'utf8');
  setCategoryArticles('events', uniqueIds);
  console.log(`Wrote ${uniqueIds.length} event ids to ${eventsIndexPath}`);
}

(async () => {
  const currentTimestamp = new Date().toISOString();
  let lastUpdated = '1970-01-01T00:00:00Z';
  const token = await getAccessToken();

  if (fs.existsSync(updateFilePath)) {
    try {
      const updateData = fs.readFileSync(updateFilePath, 'utf8');
      lastUpdated = JSON.parse(updateData).lastUpdated || lastUpdated;
    } catch (error) {
      console.warn('Failed to read update.json, using default timestamp.');
    }
  }

  try {
    console.log(`Fetching articles updated after: ${lastUpdated}`);
    const articles = await runQuery(token, {
      from: [{ collectionId: 'articles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'meta.lastUpdated' },
          op: 'GREATER_THAN',
          value: { timestampValue: lastUpdated }
        }
      }
    });
    const articleCount = await saveDocuments(articles, token);
    if (articleCount === 0) {
      console.log('No new articles found.');
    }

    console.log('Fetching all events by category');
    const eventDocs = await runQuery(token, {
      from: [{ collectionId: 'articles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'meta.category' },
          op: 'EQUAL',
          value: { stringValue: 'events' }
        }
      }
    });
    await saveDocuments(eventDocs, token);
    const liveEventIds = eventDocs
      .filter((entry) => entry.document && !entry.document.fields?.deleted?.booleanValue)
      .map((entry) => entry.document.fields?.articleId?.stringValue);
    writeEventsIndex(liveEventIds);

    fs.writeFileSync(updateFilePath, JSON.stringify({ lastUpdated: currentTimestamp }, null, 2), 'utf8');
    console.log(`Updated last fetch time in: ${updateFilePath}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
