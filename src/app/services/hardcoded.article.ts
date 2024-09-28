import { Article } from "../interfaces/article";

export const getHardcodedArticles = (): Article[] => [
    {
      imageURI: 'https://t4.ftcdn.net/jpg/02/97/78/03/360_F_297780357_pK8VCA7wctbTFusAGiCfcoxbJLRwC9Bs.jpg',
      header: 'Church Construction Complete!',
      body: 'Just completed the large 20,000 sqft Cathedral is bound to draw many people!',
      articleId: "church-construction-complete",
      meta: {
        category: 'Family',
        subCategory: 'Spiritual'
      }
    },
    {
      imageURI: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      header: 'Is Peter \'Rock?\'',
      body: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      articleId: "is-peter-rock",
      meta: {
        category: 'Test',
        subCategory: 'Article'
      }
    },
    {
      imageURI: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      header: 'Why are you not Catholic?',
      body: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      articleId: "why-not-catholic",
      meta: {
        category: 'Test',
        subCategory: 'Politics'
      }
    },
    {
      imageURI: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      header: 'Is Peter \'Rock?\'',
      body: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      articleId: "is-peter-rock",
      meta: {
        category: 'Test',
        subCategory: 'Article'
      }
    },
    {
      imageURI: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      header: 'Why are you not Catholic?',
      body: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      articleId: "why-not-catholic",
      meta: {
        category: 'Test',
        subCategory: 'Politics'
      }
    },
    {
      imageURI: 'https://png.pngtree.com/background/20230611/original/pngtree-church-with-lit-candles-inside-picture-image_3148244.jpg',
      header: 'Is Peter \'Rock?\'',
      body: 'Jesus started the Catholic Church with Peter, or Petras, which is translated into Greek as Rock.',
      articleId: "is-peter-rock",
      meta: {
        category: 'Test',
        subCategory: 'Article'
      }
    },
    {
      imageURI: 'https://i0.wp.com/holyspiritfremont.org/wp-content/uploads/2018/04/IMG_1937-e1523918613197.jpg?w=3840',
      header: 'Why are you not Catholic?',
      body: 'In a world with so many choices in religion. Why Catholicism? Holy Spirit Church of Fremont.',
      articleId: "why-not-catholic",
      meta: {
        category: 'Test',
        subCategory: 'Politics'        
      }
    },
  ];

  export const getHardcodedArticle = (articleId: string): Article | undefined => {
    const articles = getHardcodedArticles();
    return articles.find(article => article.articleId === articleId);
  };
  