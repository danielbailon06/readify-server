const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./db");

const authRoutes = require("./routes/auth.routes");
const bookRoutes = require("./routes/book.routes");
const userRoutes = require("./routes/user.routes");
const shelfRoutes = require("./routes/shelf.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

// Each time a request is made, ensure DB is connected
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (e) {
        next(e);
    }
});

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shelves", shelfRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;