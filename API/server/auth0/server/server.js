require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./firebase");
const { hasRequiredRegisterFields, normalizeLocation, validatePassword } = require("./validation");

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://127.0.0.1:5500', // Specific origin instead of array
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('sign-in'));

app.post("/register", async (req, res) => {
  try {
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
    await db.collection("Users").doc(uid).set({
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
      console.error('Error getting location:', error);
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
