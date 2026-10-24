require("dotenv").config();
const path = require("path");
const express = require("express");
const bcrypt = require("bcrypt");
const { firestore } = require("./firebase");
const { hasRequiredRegisterFields, normalizeLocation, validatePassword } = require("./validation");
const { applyApiDefaults } = require("../../http");
const { validate } = require("../../validate");
const logger = require("../../log");

function fail(res, error, fallback) {
    const status = error.statusCode || 500;
    res.status(status).json({
        message: status === 503 ? "Firebase no esta configurado" : (error.message || fallback)
    });
}

const app = express();

applyApiDefaults(app, {
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST"],
  credentials: true
});
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, "..", "sign-in")));

app.post("/register", async (req, res) => {
  try {
    const check = validate(req.body, {
      email: { required: true, type: "string" },
      password: { required: true, type: "string" },
      nombre: { required: true, type: "string" },
      uid: { required: true, type: "string" }
    });
    if (!check.ok) {
      return res.status(400).json({ message: check.errors[0] });
    }

    const { email, password, nombre, uid, location } = req.body;

    // Validaciones
    if (!hasRequiredRegisterFields({ email, password, nombre, uid })) {
      return res.status(400).json({ 
        message: "Todos los campos son requeridos" 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message: "La contraseña debe tener 8 caracteres, una mayúscula, un número y un símbolo"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear documento con el UID como nombre en la colección Users
    await firestore().collection("Users").doc(uid).set({
      Email: email,
      Password: hashedPassword,
      Nombre: nombre,
      IsAdmin: true,
      IsDeveloper: false,
      Device: "",
      DeviceSN: "",
      UserImg: "",
      faceData: null,
      lastFaceUpdate: null,
      // Guardar la ubicación del usuario
      location: normalizeLocation(location),
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ 
      message: "Usuario registrado correctamente", 
      id: uid 
    });

  } catch (err) {
    logger.error("register failed", { error: err.message });
    fail(res, err, "Error al registrar usuario");
  }
});

// Add social login handler
app.post("/social-auth", async (req, res) => {
  try {
    const check = validate(req.body, {
      uid: { required: true, type: "string" },
      email: { required: true, type: "string" },
      nombre: { required: true, type: "string" }
    });
    if (!check.ok) {
      return res.status(400).json({ message: check.errors[0] });
    }

    const { uid, email, nombre, photoURL } = req.body;
    const usersRef = firestore().collection("Users");

    // Get user location
    let location = { country: "", state: "", city: "" };
    try {
      const response = await fetch('https://ipapi.co/json/');
      const locationData = await response.json();
      location = {
        country: locationData.country_name,
        state: locationData.region,
        city: locationData.city
      };
    } catch (error) {
      logger.error("location lookup failed", { error: error.message });
    }

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
        location: location, // Add location data
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({ 
      message: "Login exitoso", 
      id: uid 
    });

  } catch (err) {
    logger.error("social auth failed", { error: err.message });
    res.status(err.statusCode || 500).json({
      message: err.statusCode === 503 ? "Firebase no esta configurado" : "Error en autenticación"
    });
  }
});

// Agregar este nuevo endpoint
app.get("/verify-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const userDoc = await firestore().collection("Users").doc(uid).get();
    
    res.json({ 
      exists: userDoc.exists 
    });
    
  } catch (error) {
    logger.error("verify user failed", { error: error.message });
    res.status(error.statusCode || 500).json({
      message: error.statusCode === 503 ? "Firebase no esta configurado" : "Error verificando usuario",
      exists: false
    });
  }
});

app.post("/save-face-data", async (req, res) => {
    try {
        const check = validate(req.body, {
            uid: { required: true, type: "string" },
            faceImage: { required: true, type: "string" }
        });
        if (!check.ok) {
            return res.status(400).json({ success: false, message: check.errors[0] });
        }

        const { uid, faceImage, faceData } = req.body;
        
        if (!uid || !faceImage) {
            return res.status(400).json({
                success: false,
                message: "Datos incompletos"
            });
        }

        // Obtener referencia al documento del usuario
        const userRef = firestore().collection("Users").doc(uid);
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
        logger.error("save face data failed", { error: error.message });
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode === 503 ? "Firebase no esta configurado" : "Error al guardar datos faciales"
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

const PORT = Number(process.env.PORT || 3003);
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info("auth server listening", { port: PORT });
  });
}

module.exports = { app };
