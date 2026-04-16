# Readify

Este repositorio contiene el Backend (API REST con Express) de Readify.

Se encarga de toda la lógica de la app, gestión de datos y autenticación de usuarios.

## ¿Qué gestiona este backend?
- Usuarios (registro, login, autenticación)
- Libros (consulta y búsqueda)
- Biblioteca personal del usuario
- Progreso de lectura
- Estanterías personalizadas (shelves)
- (Opcional) Integración con IA para recomendaciones o chat

Este repositorio corresponde EXCLUSIVAMENTE al Backend (Express API).

El Frontend (React) se encuentra aquí:
-> https://github.com/danielbailon06/readify-client

## Instalación y ejecución en local
1. Clonar el repositorio
git clone https://github.com/tu-usuario/readify-backend.git
cd readify-backend
2. Instalar dependencias
npm install
3. Variables de entorno

Crea un archivo .env en la raíz con:

PORT=5005
MONGODB_URI=mongodb://127.0.0.1:27017/readify
TOKEN_SECRET=super_secret_key
OPENAI_API_KEY=tu_api_key_opcional

### Explicación de variables
PORT → Puerto del servidor
MONGODB_URI → Conexión a la base de datos
Puedes usar MongoDB local o MongoDB Atlas
TOKEN_SECRET → Clave para firmar tokens JWT
OPENAI_API_KEY → Solo necesario si usas funcionalidades de IA
4. Ejecutar el servidor
npm run dev

Servidor disponible en:

http://localhost:5005

### Demo

API desplegada en:
-> https://readify-backend-ten.vercel.app

## Tecnologías utilizadas
- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- Bcrypt (hash de contraseñas)
- CORS
- Dotenv

## Endpoints reales de la API

### Autenticación (/api/auth)

POST /api/auth/signup
→ Registro de usuario
→ Crea usuario con avatar por defecto si no se proporciona
POST /api/auth/login
→ Login
→ Devuelve authToken (JWT)
GET /api/auth/verify 
→ Devuelve los datos del usuario autenticado

### Libros (/api/books)

GET /api/books
→ Obtener todos los libros

Permite búsqueda:

/api/books?search=romance
GET /api/books/:bookId
→ Obtener detalle de un libro

### Usuarios (/api/users)

#### Usuarios
GET /api/users 
→ Devuelve 3 usuarios aleatorios (para descubrir otros lectores)

#### Perfil de usuario
GET /api/users/:userId
→ Obtener perfil completo
→ Incluye:
wantToRead
currentlyReading
read

PUT /api/users/:userId 
→ Editar perfil
→ Campos:

{
  "username": "",
  "email": "",
  "profileImage": "",
  "bio": "",
  "location": ""
}
#### Biblioteca / Reading Status
Añadir o mover libro
POST /api/users/:userId/reading-status 🔒

Body:

{
  "bookId": "id_del_libro",
  "status": "wantToRead | currentlyReading | read"
}

Mueve el libro automáticamente entre listas

#### Eliminar libro de biblioteca
DELETE /api/users/:userId/reading-status/:bookId 🔒

Elimina el libro de todas las listas

#### Progreso de lectura
PUT /api/users/:userId/progress/:bookId 🔒

Body:

{
  "currentPage": 120
}

Guarda el progreso en readingProgress (Map en MongoDB)

### Shelves (/api/shelves)

Gestión de estanterías
GET /api/shelves 🔒
→ Obtener todas las shelves del usuario

POST /api/shelves 🔒
→ Crear nueva shelf

{
  "name": "Romance cozy",
  "description": "Libros para leer con mantita"
}
GET /api/shelves/:shelfId 🔒
→ Obtener detalle de una shelf
PUT /api/shelves/:shelfId 🔒
→ Editar shelf
DELETE /api/shelves/:shelfId 🔒
→ Eliminar shelf
Libros en shelves

POST /api/shelves/:shelfId/books 🔒
→ Añadir libro

{
  "bookId": "id_del_libro"
}
DELETE /api/shelves/:shelfId/books/:bookId 🔒
→ Quitar libro

### Chat IA (/api/chat)

#### Chat
POST /api/chat 🔒

Body:

{
  "message": "Recomiéndame algo cozy",
  "previousResponseId": "opcional"
}

Devuelve:

respuesta del asistente (Lumi)
memoria actualizada del usuario

#### Historial
GET /api/chat/history

Devuelve:

historial de conversación
memoria del usuario (gustos, mood, etc.)

### Ruta base

GET /
→ Test del servidor
→ Respuesta: "All good in here"
Autenticación
