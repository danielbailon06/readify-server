const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/isAuthenticated");

const saltRounds = 10;

// POST /api/auth/signup
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password, profileImage, bio } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const foundUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (foundUser) {
      return res.status(400).json({ message: "El usuario o el email ya existen" });
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      passwordHash: hashedPassword,
      profileImage,
      bio,
    });

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      profileImage: newUser.profileImage,
      bio: newUser.bio,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Faltan email o password" });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, foundUser.passwordHash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const payload = {
      _id: foundUser._id,
      username: foundUser.username,
      email: foundUser.email,
    };
    console.log("TOKEN_SECRET en login:", process.env.TOKEN_SECRET);

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      algorithm: "HS256",
      expiresIn: "7d",
    });

    res.json({ authToken });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/verify
router.get("/verify", isAuthenticated, (req, res, next) => {
  res.status(200).json(req.payload);
});

module.exports = router;