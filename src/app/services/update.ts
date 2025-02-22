import { ArticleService } from './article.service2'; // Adjust path if needed

// Mock Firestore configuration (Replace with actual initialization if needed)
async function updateArticle(name: string) {
    const articleService = new ArticleService();
    try {        
        console.log(`Updating article: ${name}`);
        await articleService.deleteFieldsInArticle(name);
        console.log(`Article updated successfully.`);
    } catch (error) {
        console.error('Error updating article:', error);
    }
}

// Example usage
const name = "projects/auxilium-420904/databases/aux-db/documents/articles/8DCYGJ7NREzZe57H5ADb";
updateArticle(name);