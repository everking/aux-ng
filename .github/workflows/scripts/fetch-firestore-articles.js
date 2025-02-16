(async () => {
  const fs = require('fs');
  const path = require('path');
  const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
  const dataFolder = 'src/assets/data/';


  const update = fs.readFileSync(dataFolder + "update.json", 'utf8');
  const lastUpdated = JSON.parse(update).lastUpdated;
  
  console.log(`lastUpdated: ${lastUpdated}`);

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

    if (articleCount == 0) {
      console.log("No article found.")
    }



    fs.writeFileSync(dataFolder + 'all-articles.json', JSON.stringify(articles, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
