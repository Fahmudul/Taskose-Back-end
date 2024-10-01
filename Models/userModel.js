const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      default: "User",
    },
  },
  {
    collection: "Users",
  }
);

const Users = mongoose.models.Users || mongoose.model("Users", userSchema);
module.exports = Users;
