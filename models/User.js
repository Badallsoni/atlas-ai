const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
  },

  firstName: {
    type: String,
  },

  interests: {
    type: [String],
    default: [],
  },

  followedCompanies: {
    type: [String],
    default: [],
  },

  briefingPreference: {
    type: String,
    default: null,
  },
  onboardingStep: {
  type: String,
  default: "interests"
}
});

const User = mongoose.model("User", userSchema);

module.exports = User;