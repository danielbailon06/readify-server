const express = require("express");
const router = express.Router();

const User = require("../models/User.model");
const { isAuthenticated } = require("../middleware/isAuthenticated");

// GET /api/users/:userId -> obtener perfil de usuario
router.get("/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-passwordHash") 
      .populate("wantToRead")
      .populate("currentlyReading")
      .populate("read");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:userId -> editar perfil
router.put("/:userId", isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId !== req.payload._id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const { username, email, profileImage, bio, location } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, profileImage, bio, location },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// POST /api/users/:userId/reading-status
// añadir o mover un libro a wantToRead, currentlyReading o read
router.post("/:userId/reading-status", isAuthenticated, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { bookId, status } = req.body;

    if (userId !== req.payload._id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    if (!bookId || !status) {
      return res.status(400).json({ message: "Faltan bookId o status" });
    }

    const validStatuses = ["wantToRead", "currentlyReading", "read"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status no válido" });
    }

    const pullUpdate = {
      wantToRead: bookId,
      currentlyReading: bookId,
      read: bookId,
    };

    delete pullUpdate[status];

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: pullUpdate,
        $addToSet: {
          [status]: bookId,
        },
      },
      { new: true }
    )
      .select("-passwordHash")
      .populate("wantToRead")
      .populate("currentlyReading")
      .populate("read");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:userId/reading-status/:bookId
// quitar un libro de todos los estados
router.delete("/:userId/reading-status/:bookId", isAuthenticated, async (req, res, next) => {
  try {
    const { userId, bookId } = req.params;

    if (userId !== req.payload._id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          wantToRead: bookId,
          currentlyReading: bookId,
          read: bookId,
        },
      },
      { new: true }
    )
      .select("-passwordHash")
      .populate("wantToRead")
      .populate("currentlyReading")
      .populate("read");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:userId/progress/:bookId
// actualizar progreso libros
router.put("/:userId/progress/:bookId", isAuthenticated, async (req, res, next) => {
  try {
    const { userId, bookId } = req.params;
    const { currentPage } = req.body;

    if (userId !== req.payload._id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    if (currentPage === undefined || currentPage < 0) {
      return res.status(400).json({ message: "Página no válida" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          [`readingProgress.${bookId}`]: currentPage,
        },
      },
      { new: true }
    )
      .select("-passwordHash")
      .populate("wantToRead")
      .populate("currentlyReading")
      .populate("read");

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

module.exports = router;