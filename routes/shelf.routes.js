const express = require("express");
const router = express.Router();

const Shelf = require("../models/Shelf.model");
const { isAuthenticated } = require("../middleware/isAuthenticated");

// GET - Obtener estanterías
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const { _id } = req.payload;

    const shelves = await Shelf.find({ user: _id }).populate("books");

    res.json(shelves);
  } catch (error) {
    next(error);
  }
});

// POST - Crear estantería
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { _id } = req.payload;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const newShelf = await Shelf.create({
      name,
      description,
      user: _id,
    });

    res.status(201).json(newShelf);
  } catch (error) {
    next(error);
  }
});

// GET - Obtener detalle de una estantería
router.get("/:shelfId", isAuthenticated, async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const { _id } = req.payload;

    const shelf = await Shelf.findOne({
      _id: shelfId,
      user: _id,
    }).populate("books");

    if (!shelf) {
      return res.status(404).json({ message: "Estantería no encontrada" });
    }

    res.json(shelf);
  } catch (error) {
    next(error);
  }
});

// PUT - Editar estantería
router.put("/:shelfId", isAuthenticated, async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const { _id } = req.payload;
    const { name, description } = req.body;

    const updatedShelf = await Shelf.findOneAndUpdate(
      { _id: shelfId, user: _id },
      { name, description },
      { new: true, runValidators: true }
    ).populate("books");

    if (!updatedShelf) {
      return res.status(404).json({ message: "Estantería no encontrada" });
    }

    res.json(updatedShelf);
  } catch (error) {
    next(error);
  }
});

// DELETE - Borrar estantería
router.delete("/:shelfId", isAuthenticated, async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const { _id } = req.payload;

    const deletedShelf = await Shelf.findOneAndDelete({
      _id: shelfId,
      user: _id,
    });

    if (!deletedShelf) {
      return res.status(404).json({ message: "Estantería no encontrada" });
    }

    res.json({ message: "Estantería eliminada correctamente" });
  } catch (error) {
    next(error);
  }
});

// POST - Añadir libro a estantería
router.post("/:shelfId/books", isAuthenticated, async (req, res, next) => {
  try {
    const { shelfId } = req.params;
    const { _id } = req.payload;
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ message: "Falta bookId" });
    }

    const updatedShelf = await Shelf.findOneAndUpdate(
      { _id: shelfId, user: _id },
      { $addToSet: { books: bookId } },
      { new: true }
    ).populate("books");

    if (!updatedShelf) {
      return res.status(404).json({ message: "Estantería no encontrada" });
    }

    res.json(updatedShelf);
  } catch (error) {
    next(error);
  }
});

// DELETE - Quitar libro de estantería
router.delete("/:shelfId/books/:bookId", isAuthenticated, async (req, res, next) => {
  try {
    const { shelfId, bookId } = req.params;
    const { _id } = req.payload;

    const updatedShelf = await Shelf.findOneAndUpdate(
      { _id: shelfId, user: _id },
      { $pull: { books: bookId } },
      { new: true }
    ).populate("books");

    if (!updatedShelf) {
      return res.status(404).json({ message: "Estantería no encontrada" });
    }

    res.json(updatedShelf);
  } catch (error) {
    next(error);
  }
});

module.exports = router;