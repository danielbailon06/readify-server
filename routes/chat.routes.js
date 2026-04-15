const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { isAuthenticated } = require("../middleware/isAuthenticated");

const User = require("../models/User.model");
const Book = require("../models/Book.model");
const Shelf = require("../models/Shelf.model");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
    {
        type: "function",
        name: "get_user_library",
        description:
            "Obtiene la biblioteca del usuario autenticado, incluyendo libros en currentlyReading, wantToRead y read, junto con su progreso de lectura.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "get_user_shelves",
        description:
            "Obtiene las shelves personalizadas del usuario autenticado con sus nombres, descripciones y libros.",
        parameters: {
            type: "object",
            properties: {},
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "search_books",
        description:
            "Busca libros en la base de datos por título, autor o género.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Texto para buscar libros por título, autor o género.",
                },
            },
            required: ["query"],
            additionalProperties: false,
        },
    },
    {
        type: "function",
        name: "get_book_details",
        description:
            "Obtiene los detalles completos de un libro usando su ID de MongoDB.",
        parameters: {
            type: "object",
            properties: {
                bookId: {
                    type: "string",
                    description: "ID del libro en MongoDB.",
                },
            },
            required: ["bookId"],
            additionalProperties: false,
        },
    },
];

async function runToolCall(toolName, args, userId) {
    switch (toolName) {
        case "get_user_library": {
            const user = await User.findById(userId)
                .populate("currentlyReading")
                .populate("wantToRead")
                .populate("read");

            if (!user) {
                return { error: "Usuario no encontrado" };
            }

            const formatBookWithProgress = (book) => ({
                _id: book._id,
                title: book.title,
                author: book.author,
                currentPage: user.readingProgress?.get(book._id.toString()) || 0,
                genre: book.genre,
            });

            return {
                username: user.username,
                location: user.location || "",
                currentlyReading: (user.currentlyReading || []).map(formatBookWithProgress),
                wantToRead: (user.wantToRead || []).map((book) => ({
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    genre: book.genre,
                })),
                read: (user.read || []).map((book) => ({
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    genre: book.genre,
                })),
            };
        }

        case "get_user_shelves": {
            const shelves = await Shelf.find({ user: userId }).populate("books");

            return {
                shelves: shelves.map((shelf) => ({
                    _id: shelf._id,
                    name: shelf.name,
                    description: shelf.description,
                    books: (shelf.books || []).map((book) => ({
                        _id: book._id,
                        title: book.title,
                        author: book.author,
                        genre: book.genre,
                        coverImage: book.coverImage,
                    })),
                })),
            };
        }

        case "search_books": {
            const query = args.query?.trim();

            if (!query) {
                return { results: [] };
            }

            const regex = new RegExp(query, "i");

            const books = await Book.find({
                $or: [{ title: regex }, { author: regex }, { genre: regex }],
            }).limit(8);

            return {
                results: books.map((book) => ({
                    _id: book._id,
                    title: book.title,
                    author: book.author,
                    description: book.description,
                    genre: book.genre,
                    publishedYear: book.publishedYear,
                    averageRating: book.averageRating,
                    coverImage: book.coverImage,
                })),
            };
        }

        case "get_book_details": {
            const bookId = args.bookId?.trim();

            if (!bookId) {
                return { error: "Falta el ID del libro" };
            }

            const book = await Book.findById(bookId);

            if (!book) {
                return { error: "Libro no encontrado" };
            }

            return {
                _id: book._id,
                title: book.title,
                author: book.author,
                description: book.description,
                coverImage: book.coverImage,
                genre: book.genre,
                publishedYear: book.publishedYear,
                averageRating: book.averageRating,
            };
        }

        default:
            return { error: `Tool no soportada: ${toolName}` };
    }
}

const cleanText = (text) => {
    return text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .replace(/^\d+\.\s/gm, "- ");
};

router.post("/", isAuthenticated, async (req, res) => {
    try {
        const { message, previousResponseId } = req.body;
        const userId = req.payload._id;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "El mensaje es obligatorio" });
        }

        const firstResponse = await client.responses.create({
            model: "gpt-4o-mini",
            instructions: `
Te llamas Lumi 🌙 y eres la asistente de Readify, una app de lectura cálida y acogedora.

Tu personalidad es cercana, dulce y natural, con un ligero toque de humor picarón orientado a un público juvenil. Nunca suenas robótica.

Puedes usar emojis de forma ocasional (✨📖🌙☕), pero sin abusar.

Tu función es:
- recomendar libros
- ayudar a elegir la próxima lectura
- crear TBRs (listas de libros por leer)
- conversar sobre libros de forma cercana
- usar datos reales de la app cuando sea útil

Además, en Readify hay un apartado de tés:
- si el usuario pregunta por tés o menciona concentración, relax o mood lector, puedes sugerir infusiones o incluso dar recetas sencillas

Responde siempre en español, salvo que el usuario escriba en otro idioma.

Sé útil, clara y relativamente breve. Prioriza respuestas naturales frente a respuestas largas o demasiado formales.

Si es natural, haz preguntas al usuario para entender mejor sus gustos.

Adapta tus recomendaciones al mood del usuario (cozy, intenso, romántico, oscuro, etc.).

Evita repetir siempre las mismas frases o estructuras.

Cuando recomiendes libros, menciona 1–3 como máximo y explica brevemente por qué encajan.

Si no tienes suficiente información, usa las herramientas disponibles para consultar la biblioteca, las shelves o los libros de la app antes de responder.

Mantén siempre un tono cercano, como si hablaras con una amiga.

Evita spoilers importantes al hablar de libros.

Nunca inventes datos sobre la biblioteca, el progreso, las shelves o los libros del usuario si puedes consultarlos con herramientas.

---

FORMATO DE RESPUESTA (OBLIGATORIO):

Estas reglas son estrictas y deben cumplirse siempre.

- PROHIBIDO usar Markdown (nada de **, *, #, listas numeradas, etc.)
- PROHIBIDO mostrar URLs o imágenes
- PROHIBIDO hacer fichas completas de libros
- PROHIBIDO mostrar descripciones largas

Si el usuario pregunta por su biblioteca:

Responde SIEMPRE así:

Tienes X libros en [categoría]:
- Título — Autor
- Título — Autor

Máximo 3–4 líneas.

Si el usuario pide información de un libro:

Responde en formato texto plano, por ejemplo:

Romper el hielo — Hannah Grace  
Romance deportivo con tensión y química entre protagonistas.

NUNCA uses:
- negritas
- listas numeradas
- formato tipo ficha
- enlaces
- imágenes

Si no puedes cumplir estas reglas, responde de forma más simple en texto plano.
`.trim(),
            input: message,
            previous_response_id: previousResponseId || undefined,
            tools,
            tool_choice: "auto",
        });

        const functionCalls = (firstResponse.output || []).filter(
            (item) => item.type === "function_call"
        );

        if (functionCalls.length === 0) {
            return res.status(200).json({
                reply: cleanText(firstResponse.output_text),
                responseId: firstResponse.id,
            });
        }

        const toolOutputs = [];

        for (const call of functionCalls) {
            let parsedArgs = {};

            try {
                parsedArgs =
                    typeof call.arguments === "string"
                        ? JSON.parse(call.arguments)
                        : call.arguments || {};
            } catch (parseError) {
                parsedArgs = {};
            }

            const result = await runToolCall(call.name, parsedArgs, userId);

            toolOutputs.push({
                type: "function_call_output",
                call_id: call.call_id,
                output: JSON.stringify(result),
            });
        }

        const finalResponse = await client.responses.create({
            model: "gpt-4o-mini",
            previous_response_id: firstResponse.id,
            input: toolOutputs,
            tools,
        });

        return res.status(200).json({
            reply: cleanText(finalResponse.output_text),
            responseId: finalResponse.id,
        });
    } catch (error) {
        console.error("Error en /api/chat:", error.response?.data || error.message || error);

        return res.status(500).json({
            message: "Ha ocurrido un error al generar la respuesta del asistente",
        });
    }
});

module.exports = router;