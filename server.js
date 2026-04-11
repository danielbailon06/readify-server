require("dotenv").config({ path: __dirname + "/.env" });
console.log("TOKEN_SECRET en server:", process.env.TOKEN_SECRET);
require("./db");

const app = require("./app");

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});