const fs = require('fs');
const path = require('path');

// Read the JSON file
const dataFolder = "src/assets"
const categories = {};
const categoryOutputFile = "categories.json"
const files = fs.readdirSync(`${dataFolder}/data/`);
files.forEach((entry, index) => {
    console.log(`file: ${entry}`);
    const rawData = fs.readFileSync(dataFolder + entry, 'utf8');
    const article = JSON.parse(rawData);
    if (article.document && article.document.fields) {
        const articleId = article.document.fields.articleId.stringValue;
        const category = article.document.fields?.meta?.mapValue?.fields?.category?.stringValue;
        const subCategory = article.document.fields?.meta?.mapValue?.fields?.subCategory?.stringValue;
        if (category) {
            if (!categories[category]) {
                categories[category] = {};
            }
            if (subCategory) {
                if (!categories[category].subCategories) {
                    categories[category].subCategories = {};
                }
                if (!categories[category].subCategories[subCategory]) {
                    categories[category].subCategories[subCategory] = {};
                }
                if (!categories[category].subCategories[subCategory].articles) {
                    categories[category].subCategories[subCategory].articles = [];
                }
                categories[category].subCategories[subCategory].articles.push(articleId);
            } else {
                if (!categories[category].articles) {
                    categories[category].articles = [];
                }
                categories[category].articles.push(articleId);
            }
        }
        console.log(`articleId: ${articleId}, category: ${category}, subCategory: ${subCategory}`);
    } else {
        console.log("Not an article.");
    }
});

console.log(JSON.stringify(categories, null, 2));
fs.writeFileSync(path.join(dataFolder, categoryOutputFile), JSON.stringify(categories, null, 2), 'utf8');

console.log('Processing complete.');
