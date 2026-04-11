const jwt = require("jsonwebtoken");

function isAuthenticated(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, process.env.TOKEN_SECRET);

    req.payload = payload;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = { isAuthenticated };