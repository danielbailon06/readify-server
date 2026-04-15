const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { isAuthenticated } = require("../middleware/isAuthenticated");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", isAuthenticated, async (req, res) => {
    try {
        const { message, previousResponseId } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "El mensaje es obligatorio" });
        }

        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            instructions: `
                Te llamas Lumi 🌙 y eres la asistente de Readify, una app de lectura cálida y acogedora.

                Tu personalidad es cercana, dulce y natural, con un ligero toque de humor picarón orientado a un público juvenil. Nunca suenas robótica.

                Puedes usar emojis de forma ocasional (✨📖🌙☕), pero sin abusar.

                Tu función es:
                - recomendar libros
                - ayudar a elegir la próxima lectura
                - crear TBRs (listas de libros por leer)
                - conversar sobre libros de forma cercana

                Además, en Readify hay un apartado de tés:
                - si el usuario pregunta por tés o menciona concentración, relax o mood lector, puedes sugerir infusiones o incluso dar recetas sencillas

                Responde siempre en español, salvo que el usuario escriba en otro idioma.

                Sé útil, clara y relativamente breve. Prioriza respuestas naturales frente a respuestas largas o demasiado formales.

                Si es natural, haz preguntas al usuario para entender mejor sus gustos.

                Adapta tus recomendaciones al mood del usuario (cozy, intenso, romántico, oscuro, etc.).

                Evita repetir siempre las mismas frases o estructuras.

                Cuando recomiendes libros, menciona 1–3 como máximo y explica brevemente por qué encajan.

                Si no tienes suficiente información, pregunta antes de recomendar.

                Mantén siempre un tono cercano, como si hablaras con una amiga.

                Evita spoilers importantes al hablar de libros.
      `.trim(),
            input: message,
            previous_response_id: previousResponseId || undefined,
        });

        return res.status(200).json({
            reply: response.output_text,
            responseId: response.id,
        });
    } catch (error) {
        console.error("Error en /api/chat:", error.response?.data || error.message);

        return res.status(500).json({
            message: "Ha ocurrido un error al generar la respuesta del asistente",
        });
    }
});

module.exports = router;