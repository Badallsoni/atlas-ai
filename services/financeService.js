const axios = require("axios");

async function getFinanceNews() {
  try {
    const response = await axios.get(
      "https://newsapi.org/v2/top-headlines",
      {
        params: {
          category: "business",
          language: "en",
          pageSize: 20,
          apiKey: process.env.NEWS_API_KEY,
        },
      }
    );

    // If API doesn't return articles
    if (!response.data || !response.data.articles) {
      console.log("No articles returned from NewsAPI.");
      return [];
    }

    const blockedWords = [
      "chatgpt",
      "opinion",
      "prediction",
      "rumor",
      "rumour",
      "might",
      "could",
      "watch",
      "best stocks",
      "top stocks",
      "youtube",
      "sponsored",
      "advertisement",
    ];

    // Remove clickbait articles
    const filtered = response.data.articles.filter((article) => {
      const title = (article.title || "").toLowerCase();

      return !blockedWords.some((word) => title.includes(word));
    });

    // Remove duplicate titles
    const uniqueArticles = [];
    const seenTitles = new Set();

    for (const article of filtered) {
      if (
        article.title &&
        !seenTitles.has(article.title.toLowerCase())
      ) {
        seenTitles.add(article.title.toLowerCase());
        uniqueArticles.push(article);
      }
    }

    const importantKeywords = [
  "market",
  "stock",
  "earnings",
  "fed",
  "interest",
  "inflation",
  "economy",
  "revenue",
  "profit",
  "shares",
  "nasdaq",
  "dow",
  "s&p",
  "ai",
  "nvidia",
  "apple",
  "microsoft",
  "tesla",
  "amazon",
  "google",
];

const importantArticles = uniqueArticles.filter((article) => {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();

  return importantKeywords.some((keyword) =>
    text.includes(keyword)
  );
});

return importantArticles.slice(0, 10);
  } catch (error) {
    console.error(
      "Finance API Error:",
      error.response?.data || error.message
    );

    return [];
  }
}

module.exports = {
  getFinanceNews,
};