# 📊 Atlas AI – Telegram Financial Intelligence Bot

Atlas AI is an AI-powered Telegram bot that provides personalized financial insights using Gemini AI, live business news, and user preferences.

## ✨ Features

- 🤖 AI-powered financial assistant using Google Gemini
- 📰 Live business and market news
- 📈 Personalized market briefings
- 🏢 Follow your favorite companies
- 💬 Conversation memory
- 👤 User onboarding
- ⏰ Daily morning and evening briefings
- 📊 User profile management
- 🔄 Reset onboarding

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Telegram Bot API
- Google Gemini API
- NewsAPI
- Node Cron

---

## 📂 Project Structure

```
atlas-ai/
│
├── models/
│   ├── User.js
│   └── Conversation.js
│
├── services/
│   ├── aiService.js
│   ├── financeService.js
│   └── scheduler.js
│
├── index.js
├── package.json
├── .env.example
└── README.md
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/atlas-ai.git
```

Install dependencies:

```bash
npm install
```

Create a `.env` file using `.env.example`.

Start the application:

```bash
npm start
```

---

## 🔑 Environment Variables

Create a `.env` file with:

```env
MONGODB_URI=your_mongodb_connection_string

TELEGRAM_BOT_TOKEN=your_telegram_bot_token

GEMINI_API_KEY=your_gemini_api_key

NEWS_API_KEY=your_news_api_key

PORT=3000
```

---

## 🤖 Bot Commands

- `/start` – Start onboarding
- `/today` – Personalized market briefing
- `/profile` – View profile
- `/help` – Show available commands
- `/reset` – Reset profile and onboarding

---

## 🚀 Future Improvements

- Stock price charts
- Portfolio tracking
- Multi-language support
- Watchlists
- Price alerts
- Advanced investment analytics

---

## 👨‍💻 Author

**Badal Soni**

Built as an AI-powered financial intelligence Telegram bot.
