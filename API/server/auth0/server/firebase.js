const admin = require("firebase-admin");
require("dotenv").config();

function firestore() {
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        const error = new Error("FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL must be provided");
        error.statusCode = 503;
        throw error;
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                client_email: process.env.FIREBASE_CLIENT_EMAIL
            })
        });
    }

    return admin.firestore();
}

module.exports = { firestore };
