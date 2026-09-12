const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

const { updateCategoryPlacement, removeArticleFromCategories } = require(path.resolve(__dirname, 'sync-category'));

const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
const firestoreBase = 'https://firestore.googleapis.com/v1';
const dataFolder = 'src/assets/data/articles';
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

(async () => {
  const currentTimestamp = new Date().toISOString();
  let lastUpdated = "1970-01-01T00:00:00Z";
  const token = await getAccessToken();

  // Read last update timestamp
  if (fs.existsSync(updateFilePath)) {
    try {
      const updateData = fs.readFileSync(updateFilePath, 'utf8');
      lastUpdated = JSON.parse(updateData).lastUpdated || lastUpdated;
    } catch (error) {
      console.warn("Failed to read update.json, using default timestamp.");
    }
  }

  console.log(`Fetching articles updated after: ${lastUpdated}`);

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'articles' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'meta.lastUpdated' },
              op: 'GREATER_THAN', // Fetch articles updated after the given timestamp
              value: { timestampValue: lastUpdated }
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error fetching Firestore data: ${response.statusText}`);
    }

    const articles = await response.json();
    let articleCount = 0;

    for (const [index, entry] of articles.entries()) {
      if (!entry.document) {
        continue;
      }

      articleCount++;
      const documentName = entry.document.name;

      if (entry.document.fields && entry.document.fields.articleId) {
        const articleId = entry.document.fields.articleId.stringValue;
        const filePath = path.join(dataFolder, `${articleId}.json`);

        if (entry.document.fields.deleted?.booleanValue) {
          await purgeDeletedArticle({ articleId, documentName, filePath, token });
        } else {
          fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
          console.log(`Saved: ${filePath}`);
          updateCategoryPlacement(entry.document);
        }
      } else {
        console.warn(`Skipping entry ${index} ${documentName} due to missing articleId.`);
      }
    }

    if (articleCount === 0) {
      console.log("No new articles found.");
    } else {
      // Update the last updated timestamp
      fs.writeFileSync(updateFilePath, JSON.stringify({ lastUpdated: currentTimestamp }, null, 2), 'utf8');
      console.log(`Updated last fetch time in: ${updateFilePath}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
