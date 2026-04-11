const express = require("express");
const router = express.Router();

const Book = require("../models/Book.model");

// GET - Obtener todos los libros
router.get("/", async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ],
      };
    }

    const books = await Book.find(query);

    res.json(books);
  } catch (error) {
    next(error);
  }
});

// GET - Obtener detalle de un libro
router.get("/:bookId", async (req, res, next) => {
  try {
    const { bookId } = req.params;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }

    res.json(book);
  } catch (error) {
    next(error);
  }
});

module.exports = router;