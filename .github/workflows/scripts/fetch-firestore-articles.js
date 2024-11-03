(async () => {
  const fs = require('fs');  
  const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'articles' }]
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching Firestore data: ${response.statusText}`);
    }

    const data = await response.json();
    fs.writeFileSync('src/assets/data/all-articles.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
