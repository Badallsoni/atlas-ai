const cron = require("node-cron");

const User = require("../models/User");
const { getFinanceNews } = require("./financeService");
const { generateAIResponse } = require("./aiService");

async function sendBriefings(bot, type) {
  try {
    console.log(`Running ${type} briefing...`);

    const users = await User.find({
      briefingPreference: type,
    });

    if (users.length === 0) {
      console.log(`No users found for ${type} briefing.`);
      return;
    }

    // Fetch news only once for all users
    const financeNews = await getFinanceNews();

    for (const user of users) {
      try {
        const prompt = [
          {
            role: "user",
            content:
              type === "morning"
                ? "Generate today's personalized morning market briefing."
                : "Generate today's personalized evening market summary.",
          },
        ];

        const briefing = await generateAIResponse(
          prompt,
          financeNews,
          user.followedCompanies || []
        );

        await bot.sendMessage(
          user.telegramId,
          `${
            type === "morning"
              ? "☀️ Good Morning!"
              : "🌙 Evening Summary"
          }\n\n${briefing}`
        );

        console.log(
          `Sent ${type} briefing to ${user.firstName || user.telegramId}`
        );
      } catch (error) {
        console.error(
          `Failed to send ${type} briefing to ${user.telegramId}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(`${type} scheduler error:`, error.message);
  }
}

function startScheduler(bot) {
  console.log("Scheduler started...");

  // Morning briefing - every day at 8:00 AM (India)
  cron.schedule(
    "0 8 * * *",
    async () => {
      await sendBriefings(bot, "morning");
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // Evening briefing - every day at 7:00 PM (India)
  cron.schedule(
    "0 19 * * *",
    async () => {
      await sendBriefings(bot, "evening");
    },
    {
      timezone: "Asia/Kolkata",
    }
  );
}

module.exports = {
  startScheduler,
};