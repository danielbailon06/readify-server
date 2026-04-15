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
    location: {
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
    readingProgress: {
      type: Map,
      of: Number,
      default: {},
    },
    chatMemory: {
      mood: {
        type: String,
        default: "",
      },
      preferredGenres: {
        type: [String],
        default: [],
      },
      dislikedGenres: {
        type: [String],
        default: [],
      },
      shortReplies: {
        type: Boolean,
        default: false,
      },
    },
    chatHistory: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);