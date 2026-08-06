const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateAIResponse(
    recentMessages,
    financeNews = [],
    preferredCompanies = []
) {
  const maxRetries = 3;
const newsContext =
  financeNews.length > 0
    ? `
Latest Financial News:

${financeNews
  .map(
    (article, index) =>
      `${index + 1}. ${article.title}
${article.description || ""}
Source: ${article.source.name}`
  )
  .join("\n\n")}
`
    : "";

    const companyContext =
preferredCompanies.length > 0
? `

User follows these companies:

${preferredCompanies.join(", ")}

Prioritize news related to these companies whenever possible.
`
: "";
  const contents = recentMessages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: message.content,
      },
    ],
  }));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: contents,

        config: {
          systemInstruction: `
You are Atlas, an intelligent financial assistant inside Telegram.

${newsContext}

${companyContext}

Rules:

If the user asks for today's briefing:

Return:

📊 Today's Market Brief

Then include only the 3 most important stories.

For every story:

📌 Headline

Why it matters:
(one concise explanation)

At the end write:

Key Takeaway:
(one sentence)

If companies followed by the user appear in today's news,
prioritize them.

Never invent information.

Keep responses below 250 words.

Use Markdown.
`
        },
      });

      return response.text;

    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 2000 * attempt)
      );
    }
  }
}

module.exports = { generateAIResponse };