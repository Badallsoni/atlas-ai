require("dotenv").config();

const express = require("express");
const { TelegramBot } = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const User = require("./models/User");
const { generateAIResponse } = require("./services/aiService");
const Conversation = require("./models/Conversation");
const { getFinanceNews } = require("./services/financeService");
const { startScheduler } = require("./services/scheduler");
const app = express();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || "there";
  try {
  let user = await User.findOne({
  telegramId: msg.from.id,
});

if (!user) {
  user = await User.create({
    telegramId: msg.from.id,
    firstName: firstName,
  });

  console.log("New user created:", user.firstName);
} else {
  console.log("Existing user:", user.firstName);

  if (user.onboardingStep === "completed") {
    return bot.sendMessage(
      chatId,
      `👋 Welcome back, ${firstName}!

You're already set up.

Try:

📊 /today - Today's market briefing
👤 /profile - View your profile
❓ /help - See available commands

Or simply ask me anything about finance.`
    );
  }
}
} catch (error) {
  console.error("Error creating user:", error.message);

  return bot.sendMessage(
    chatId,
    "Something went wrong while starting Atlas. Please try again."
  );
}

  const welcomeMessage = `
👋 Hey ${firstName}! I'm Atlas.

I help you stay on top of markets, companies, and important updates without the information overload.

What would you like Atlas to help you with?

Choose one to personalize your experience.
`;

  bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📈 Finance", callback_data: "interest_finance" },
          { text: "💰 Investing", callback_data: "interest_investing" },
        ],
        [
          { text: "💻 Technology", callback_data: "interest_technology" },
          { text: "🚀 Startups", callback_data: "interest_startups" },
        ],
        [{ text: "Skip for now →", callback_data: "skip_onboarding" }],
      ],
    },
  });
});
bot.onText(/\/profile/, async (msg) => {

const user = await User.findOne({
telegramId: msg.from.id
});

if(!user){
return bot.sendMessage(msg.chat.id,"Profile not found.");
}

bot.sendMessage(
msg.chat.id,

`👤 *Your Atlas Profile*

📌 Interests:
${user.interests.length ? user.interests.join(", ") : "None"}

🏢 Companies:
${user.followedCompanies.length
  ? user.followedCompanies.join(", ")
  : "None"}

🕒 Briefing:
${user.briefingPreference || "Not set"}
`,
{
parse_mode:"Markdown"
}
);

});
bot.onText(/\/reset/, async (msg) => {
  try {
    await User.findOneAndUpdate(
      { telegramId: msg.from.id },
      {
        $set: {
          interests: [],
          followedCompanies: [],
          briefingPreference: "",
          onboardingStep: "interests",
        },
      }
    );

    await Conversation.deleteMany({
      telegramId: msg.from.id,
    });

    bot.sendMessage(
      msg.chat.id,
      "✅ Profile reset successfully.\n\nType /start to begin onboarding again."
    );
  } catch (error) {
    bot.sendMessage(
      msg.chat.id,
      "Unable to reset your profile."
    );
  }
});
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const data = query.data;

  try {
    if (data.startsWith("interest_")) {
      const interest = data.replace("interest_", "");

      await User.findOneAndUpdate(
  { telegramId: telegramId },
  {
    $addToSet: { interests: interest },
    $set: { onboardingStep: "companies" },
  }
);
      await bot.sendMessage(
  chatId,
  `✅ Got it! I'll remember that you're interested in ${interest}.

Which companies would you like me to follow?

For example: NVIDIA, Apple, Microsoft, Tesla

Just type the company names below.`
);
    }

    if (data === "skip_onboarding") {
      bot.sendMessage(
        chatId,
        "No problem! You can start chatting with me anytime."
      );
    }

    bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error saving interest:", error.message);

    bot.sendMessage(
      chatId,
      "Something went wrong while saving your preference."
    );
  }
  if (data.startsWith("briefing_")) {
  const preference = data.replace("briefing_", "");

  await User.findOneAndUpdate(
    { telegramId: telegramId },
    {
      $set: {
        briefingPreference: preference,
        onboardingStep: "completed",
      },
    }
  );

  await bot.sendMessage(
    chatId,
    `Perfect! Your ${preference === "none" ? "daily briefing is turned off" : `${preference} briefing is set`}.

You're all set! 🎉

You can now ask me things like:
• What's happening in the market?
• What's important today?
• Tell me about NVIDIA
• Compare Apple and Microsoft`
  );
}
});
bot.onText(/\/today/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({
      telegramId: msg.from.id,
    });

    if (!user) {
      return bot.sendMessage(
        chatId,
        "Please complete onboarding first using /start."
      );
    }

    await bot.sendChatAction(chatId, "typing");

    const financeNews = await getFinanceNews();

    const briefingPrompt = [
      {
        role: "user",
        content:
          "Give me my personalized market briefing for today.",
      },
    ];

    const aiResponse = await generateAIResponse(
      briefingPrompt,
      financeNews,
      user.followedCompanies
    );

    await bot.sendMessage(chatId, aiResponse);

  } catch (error) {
    console.error(error.message);

    bot.sendMessage(
      chatId,
      "Unable to generate today's briefing."
    );
  }
});
bot.on("message", async (msg) => {
  if (!msg.text || msg.text.startsWith("/")) {
    return;
  }

  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = await User.findOne({
      telegramId: telegramId,
    });

    if (!user) {
      return;
    }

    if (user.onboardingStep === "companies") {
      const companies = msg.text
        .split(",")
        .map((company) => company.trim())
        .filter((company) => company.length > 0);

      await User.findOneAndUpdate(
        { telegramId: telegramId },
        {
          $addToSet: {
            followedCompanies: {
              $each: companies,
            },
          },
          $set: {
            onboardingStep: "briefing",
          },
        }
      );

     await bot.sendMessage(
  chatId,
  `Great! I'll keep an eye on ${companies.join(", ")}.

When would you like your daily briefing?`,
  {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "☀️ Morning",
            callback_data: "briefing_morning",
          },
          {
            text: "🌙 Evening",
            callback_data: "briefing_evening",
          },
        ],
        [
          {
            text: "🔕 No daily briefing",
            callback_data: "briefing_none",
          },
        ],
      ],
    },
  }
);
    }

    if (user.onboardingStep === "completed") {

  // Save user's message
  await Conversation.create({
    telegramId: telegramId,
    role: "user",
    content: msg.text,
  });

  const recentMessages = await Conversation.find({
  telegramId: telegramId,
})
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

recentMessages.reverse();

  await bot.sendChatAction(chatId, "typing");

  const preferredCompanies = user.followedCompanies || [];

const financeKeywords = [
  "market",
  "stock",
  "stocks",
  "share",
  "finance",
  "invest",
  "investment",
  "economy",
  "inflation",
  "fed",
  "earnings",
  "news",
  "today",
  ...preferredCompanies.map(company => company.toLowerCase()),
];

const needsFinanceNews = financeKeywords.some(keyword =>
  msg.text.toLowerCase().includes(keyword)
);

let financeNews = [];

if (needsFinanceNews) {
  financeNews = await getFinanceNews();
}
  // Get response from Gemini
const aiResponse = await generateAIResponse(
    recentMessages,
    financeNews,
    preferredCompanies
);

  // Save Atlas's response
  await Conversation.create({
    telegramId: telegramId,
    role: "assistant",
    content: aiResponse,
  });

  // Send response to Telegram
  await bot.sendMessage(chatId, aiResponse);
}
  } catch (error) {
    console.error("Message handling error:", error.message);

    bot.sendMessage(
      chatId,
      "Something went wrong. Please try again."
    );
  }
});
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
`🤖 *Atlas AI Commands*

📊 /today
Get today's personalized market briefing.

👤 /profile
View your profile.

❓ /help
Show this help menu.

💬 You can also ask:

• What is inflation?
• Tell me about NVIDIA.
• Compare Apple and Microsoft.
• What's happening in the market today?

Atlas uses live financial news and AI to provide personalized insights.`,
    {
      parse_mode: "Markdown",
    }
  );
});
app.get("/", (req, res) => {
  res.send("Atlas AI server is running!");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
startScheduler(bot);