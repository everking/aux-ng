const fs = require('fs');
const path = require('path');

// Read the JSON file
const dataFolder = "/Users/edeguzma/personal-dev/aux-all/aux-ng-dev/src/assets/data/"
const articlesJsonFile = "all-articles.json";
const rawData = fs.readFileSync(dataFolder + articlesJsonFile, 'utf8');
const articles = JSON.parse(rawData);

// Process each document and save it to a separate file
articles.forEach((entry, index) => {
    const documentName = entry.document.name;

    if (entry.document.fields && entry.document.fields.articleId) {
        const articleId = entry.document.fields.articleId.stringValue;

        const filePath = path.join(dataFolder, `${articleId}.json`);
        
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf8');
        console.log(`Saved: ${filePath}`);
    } else {
        console.warn(`Skipping entry ${index} ${documentName} due to missing articleId.`);
    }
});

console.log('Processing complete.');
