const express = require("express");
const cors = require("cors");
const logger = require("morgan");

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/books", require("./routes/book.routes"));
app.use("/api/shelves", require("./routes/shelf.routes"));

module.exports = app;