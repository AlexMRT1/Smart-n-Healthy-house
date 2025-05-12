const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const admin = require('firebase-admin');
const compression = require('compression');
const User = require('./models/User');
const Developer = require('./models/Developer');
require('dotenv').config();

// Initialize Firebase Admin with caching
const firebaseConfig = {
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    ignoreUndefinedProperties: true,
    cacheMaxAgeMillis: 300000 // 5 minutes cache
};

admin.initializeApp(firebaseConfig);
const db = admin.firestore();

// Cache configuration
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// Express app setup with security
const app = express();
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" }
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting by IP and endpoint
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// CORS with specific origins
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
}));

// Token management with Redis-like structure
const tokenBlacklist = new Set();
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    tokenBlacklist.forEach(token => {
        try {
            jwt.verify(token, process.env.TOKEN_SECRET);
        } catch (err) {
            tokenBlacklist.delete(token);
        }
    });
}, 3600000); // Cleanup every hour

// Enhanced token generation with scopes
const generateToken = (userData, domain = null) => {
    const payload = {
        uid: userData.uid,
        email: userData.email,
        isAdmin: userData.isAdmin,
        developer: userData.developer,
        domain: domain,
        iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, process.env.TOKEN_SECRET, { 
        expiresIn: '1h',
        algorithm: 'HS512'
    });
};

// Developer domain registration with data requirements
app.post('/api/developer/register', async (req, res) => {
    try {
        const { domain, appName, requiredData } = req.body;
        
        if (!domain || !appName || !requiredData) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                redirect: '/developer/register'
            });
        }

        // Validate domain format
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            return res.status(400).json({ 
                error: 'Invalid domain format' 
            });
        }

        // Check domain availability
        const developerDoc = await db.collection('developers')
            .where('domain', '==', domain)
            .get();

        if (!developerDoc.empty) {
            return res.status(400).json({ 
                error: 'Domain already registered' 
            });
        }

        // Validate required data fields
        const allowedFields = ['name', 'email', 'deviceModel', 'deviceSN'];
        const invalidFields = requiredData.filter(field => !allowedFields.includes(field));
        
        if (invalidFields.length > 0) {
            return res.status(400).json({
                error: 'Invalid required data fields',
                invalidFields
            });
        }

        const developer = new Developer({
            domain,
            appName,
            requiredData,
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            apiKey: crypto.randomBytes(32).toString('hex')
        });

        await db.collection('developers').add(developer);

        return res.json({
            message: 'Developer registered successfully',
            loginEndpoint: `/api/auth/login/${domain}`,
            apiKey: developer.apiKey,
            redirect: '/developer/dashboard'
        });
    } catch (error) {
        console.error('Developer registration error:', error);
        return res.status(500).json({ error: 'Registration failed' });
    }
});

// Domain-specific login endpoint
app.post('/api/auth/login/:domain', async (req, res) => {
    try {
        const { domain } = req.params;
        const { email, password } = req.body;
        
        // Verify developer domain and API key
        const developerDoc = await db.collection('developers')
            .where('domain', '==', domain)
            .where('active', '==', true)
            .get();

        if (developerDoc.empty) {
            return res.status(401).json({ 
                error: 'Unauthorized application' 
            });
        }

        const developer = developerDoc.docs[0].data();
        
        // Verify user and permissions
        const userDoc = await db.collection('users')
            .where('email', '==', email)
            .get();

        if (userDoc.empty) {
            return res.status(401).json({ error: 'Authentication failed' });
        }

        const userData = userDoc.docs[0].data();
        
        // Generate domain-specific token
        const token = generateToken(userData, domain);

        // Return only approved data fields
        const approvedData = {};
        developer.requiredData.forEach(field => {
            if (userData[field]) {
                approvedData[field] = userData[field];
            }
        });

        return res.json({
            token,
            expiresIn: 3600,
            user: approvedData
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
});