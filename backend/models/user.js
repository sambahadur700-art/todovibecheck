const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please add a name"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "please add an email"],
      unique: true,
      lowercase: true,

      match: [
        /^\w+([.-]?\w)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, // ✅ Fixed: added backslash
        "please add a valid email",
      ],
    },
    password: {
      type: String,
      minlength: [6, "please add a password within 6 characters"],
      select: false, // don't return password in query by default
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
