require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./firebase");

const app = express();
app.use(express.json());

const USERS_DOC_ID = "GuJNZZyq5M5QW6aAq8Rv";

// Registrar usuario
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña requeridos" });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear ID único para el usuario
    const userId = db.collection("Users").doc().id;

    // Guardar en el documento específico
    await db.collection("Users").doc(USERS_DOC_ID).set({
      Email: email,
      ID: userId,
      Password: hashedPassword,
    });

    res.status(201).json({ message: "Usuario registrado correctamente", id: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
