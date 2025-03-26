const fs = require('fs');
const path = require('path');

const queryUrl = 'https://firestore.googleapis.com/v1/projects/auxilium-420904/databases/aux-db/documents:runQuery';
const dataFolder = 'src/assets/data/';
const updateFilePath = path.join(dataFolder, '../update.json'); // One level up
const categoriesPath = path.join(dataFolder, '../categories.json');

// Helper: Update categories.json with correct placement
function updateCategoryPlacement(article) {
  const articleId = article.fields.articleId?.stringValue;
  const categoryKey = article.fields.meta?.mapValue?.fields?.category?.stringValue;
  const subCategoryKey = article.fields.meta?.mapValue?.fields?.subCategory?.stringValue;

  if (!articleId || !categoryKey) {
    console.warn(`Skipping category update: Missing articleId or category`);
    return;
  }

  const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
  const isDefault = !subCategoryKey || subCategoryKey === 'default';

  const currentCategory = categoriesData.categories.find(cat => {
    if (cat.key !== categoryKey) return false;

    if (isDefault) {
      return cat.articles?.includes(articleId);
    } else {
      return cat.subCategories?.some(sub => sub.key === subCategoryKey && sub.articles?.includes(articleId));
    }
  });

  // ✅ If already in the correct location, exit early
  if (currentCategory) {
    console.log(`"${articleId}" already correctly placed under "${categoryKey}"${isDefault ? '' : ` > ${subCategoryKey}`}`);
    return;
  }

  // Remove articleId from all locations
  categoriesData.categories.forEach(cat => {
    cat.subCategories?.forEach(sub => {
      sub.articles = sub.articles?.filter(id => id !== articleId) || [];
    });
    if (cat.articles) {
      cat.articles = cat.articles.filter(id => id !== articleId);
    }
  });

  // Add to correct location
  const targetCategory = categoriesData.categories.find(cat => cat.key === categoryKey);
  if (!targetCategory) {
    console.warn(`Category '${categoryKey}' not found`);
    return;
  }

  if (isDefault) {
    if (!targetCategory.articles) targetCategory.articles = [];
    targetCategory.articles.push(articleId);
    console.log(`Placed "${articleId}" under category "${categoryKey}" (no subcategory)`);
  } else {
    const targetSub = targetCategory.subCategories?.find(sub => sub.key === subCategoryKey);
    if (targetSub) {
      targetSub.articles = targetSub.articles || [];
      targetSub.articles.push(articleId);
      console.log(`Placed "${articleId}" under "${categoryKey} > ${subCategoryKey}"`);
    } else {
      console.warn(`Subcategory '${subCategoryKey}' not found under '${categoryKey}'`);
    }
  }

  fs.writeFileSync(categoriesPath, JSON.stringify(categoriesData, null, 2), 'utf8');
}

module.exports = { updateCategoryPlacement };