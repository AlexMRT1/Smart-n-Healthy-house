const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
    createSession,
    buildContext,
    clearHistory,
    mergeStates,
    runGeneration
} = require('./domain/assistant');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const session = createSession();

function setupGemini(userName = '') {
    dotenv.config({ path: '../../user/Data/private/ApiKeys.env' });
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const CONTEXT = buildContext(userName, session.states, process.env.CONTEXT);

    if (!GOOGLE_API_KEY) {
        throw new Error("Please set GOOGLE_API_KEY in your environment variables");
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return { model, CONTEXT };
}

async function generateResponse(model, prompt, context) {
    const result = await runGeneration(session, model, prompt, context);
    return result.response;
}

app.get('/api/chat', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId, userName } = req.body;

        if (!message) {
            return res.json({ error: 'No message provided' });
        }

        const { model, CONTEXT } = setupGemini(userName);
        const response = await generateResponse(model, message, CONTEXT);

        res.json({
            success: true,
            response,
            sessionId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Conexión establecida correctamente con el servidor'
    });
});

app.post('/api/clearContext', (req, res) => {
    clearHistory(session);
    res.json({ status: 'success', message: 'Context cleared' });
});

app.post('/api/updateStates', (req, res) => {
    try {
        session.states = mergeStates(session.states, req.body);
        console.log('States updated:', session.states);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating states:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});