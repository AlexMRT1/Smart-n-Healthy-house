require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./firebase");

const app = express();
app.use(express.json());

// Servir archivos estáticos
app.use(express.static('sign-in'));

const USERS_DOC_ID = "GuJNZZyq5M5QW6aAq8Rv";

// Middleware de validación
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return password.length >= minLength && 
         hasUpperCase && 
         hasSpecialChar && 
         hasNumber;
};

app.post("/register", async (req, res) => {
  try {
    const { email, password, nombre } = req.body;

    // Validaciones
    if (!email || !password || !nombre) {
      return res.status(400).json({ 
        message: "Email, contraseña y nombre son requeridos" 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Formato de email inválido" 
      });
    }

    // Validar contraseña
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: "La contraseña no cumple con los requisitos de seguridad" 
      });
    }

    // Verificar si el email ya existe
    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("Email", "==", email).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ 
        message: "El email ya está registrado" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = usersRef.doc().id;

    await usersRef.doc(USERS_DOC_ID).set({
      Email: email,
      ID: userId,
      Password: hashedPassword,
      Nombre: nombre
    });

    res.status(201).json({ 
      message: "Usuario registrado correctamente", 
      id: userId 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Error al registrar usuario" 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
