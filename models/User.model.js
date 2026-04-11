const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    wantToRead: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    currentlyReading: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    read: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);