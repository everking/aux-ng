(async () => {
  const fs = require('fs');
  const path = require('path');

  const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
  const dataFolder = 'src/assets/data/';
  const updateFilePath = path.join(dataFolder, '../update.json'); // One level up
  const currentTimestamp = new Date().toISOString(); // Capture the start time

  let lastUpdated = "1970-01-01T00:00:00Z"; // Default fallback if update.json is missing or invalid

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
        'Content-Type': 'application/json'
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
          },
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Error fetching Firestore data: ${response.statusText}`);
    }

    const articles = await response.json();
    let articleCount = 0;

    articles.forEach((entry, index) => {
      if (entry.document) {
        articleCount++;
        const documentName = entry.document.name;

        if (entry.document.fields && entry.document.fields.articleId) {
          const articleId = entry.document.fields.articleId.stringValue;
          const filePath = path.join(dataFolder, `${articleId}.json`);

          fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
          console.log(`Saved: ${filePath}`);
        } else {
          console.warn(`Skipping entry ${index} ${documentName} due to missing articleId.`);
        }
      }
    });

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