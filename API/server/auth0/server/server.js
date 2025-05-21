require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./firebase");
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Specific origin instead of array
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
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
    const { email, password, nombre, uid } = req.body;

    // Validaciones
    if (!email || !password || !nombre || !uid) {
      return res.status(400).json({ 
        message: "Todos los campos son requeridos" 
      });
    }

    // Verificar si el email ya existe en la colección Users
    const usersRef = db.collection("Users");
    const snapshot = await usersRef.where("Email", "==", email).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ 
        message: "El email ya está registrado" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear documento con el UID como nombre en la colección Users
    await usersRef.doc(uid).set({
      Email: email,
      Password: hashedPassword,
      Nombre: nombre,
      IsAdmin: true,
      IsDeveloper: false,
      Device: "",
      DeviceSN: "",
      Sensors: ['battery: ""','Fire: ""','water_level: ""','cam:"active"','gas: ""'],
      UserImg: "", // Aquí se guardará la imagen facial
      faceData: null, // Aquí se guardarán los datos del reconocimiento facial
      lastFaceUpdate: null,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ 
      message: "Usuario registrado correctamente", 
      id: uid 
    });

  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ 
      message: err.message || "Error al registrar usuario" 
    });
  }
});

// Add social login handler
app.post("/social-auth", async (req, res) => {
  try {
    const { uid, email, nombre, photoURL } = req.body;
    const usersRef = db.collection("Users");

    // Check if user exists
    const userDoc = await usersRef.doc(uid).get();

    if (!userDoc.exists) {
      // Create new user document
      await usersRef.doc(uid).set({
        Email: email,
        Nombre: nombre,
        IsAdmin: true,
        IsDeveloper: false,
        Device: "",
        DeviceSN: "",
        Sensors: [],
        battery: "",
        UserImg: photoURL || "",
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({ 
      message: "Login exitoso", 
      id: uid 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      message: "Error en autenticación" 
    });
  }
});

// Agregar este nuevo endpoint
app.get("/verify-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await db.collection("Users").doc(uid).get();
    
    res.json({ 
      exists: userDoc.exists 
    });
    
  } catch (error) {
    console.error('Error verificando usuario:', error);
    res.status(500).json({ 
      message: "Error verificando usuario",
      exists: false
    });
  }
});

app.post("/save-face-data", async (req, res) => {
    try {
        const { uid, faceImage, faceData } = req.body;
        
        if (!uid || !faceImage) {
            return res.status(400).json({
                success: false,
                message: "Datos incompletos"
            });
        }

        // Obtener referencia al documento del usuario
        const userRef = db.collection("Users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // Guardar imagen en base64 en el documento del usuario
        await userRef.update({
            UserImg: faceImage,
            faceData: faceData,
            lastFaceUpdate: new Date().toISOString()
        });

        res.json({
            success: true,
            message: "Datos faciales guardados correctamente"
        });

    } catch (error) {
        console.error('Error guardando datos faciales:', error);
        res.status(500).json({
            success: false,
            message: "Error al guardar datos faciales"
        });
    }
});

app.get('/config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
});

const PORT = 3003;  // Forzar el puerto 3003
app.listen(PORT, () => {
  console.log(`🔐 Servidor de autenticación corriendo en puerto ${PORT}`);
});
