const admin = require("firebase-admin");
const serviceAccount = require("./prueba-1e1a3-firebase-adminsdk-fbsvc-fd357fab43.json"); // tu clave privada

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;
