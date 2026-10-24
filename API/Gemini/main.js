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
const { validate } = require('../server/validate');
const logger = require('../server/log');

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
        const check = validate(req.body, {
            message: { required: true, type: 'string' }
        });
        if (!check.ok) {
            return res.status(400).json({ success: false, error: check.errors[0] });
        }

        const { message, sessionId, userName } = req.body;

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

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/api/test', (req, res) => {
    res.json({
        status: 'success',
        message: 'Conexión establecida correctamente con el servidor'
    });
});

app.post('/api/clearContext', (req, res) => {
    const check = validate(req.body ?? {}, {});
    if (!check.ok) {
        return res.status(400).json({ success: false, error: check.errors[0] });
    }
    clearHistory(session);
    res.json({ status: 'success', message: 'Context cleared' });
});

app.post('/api/updateStates', (req, res) => {
    try {
        const check = validate(req.body, {});
        if (!check.ok) {
            return res.status(400).json({ success: false, error: check.errors[0] });
        }
        session.states = mergeStates(session.states, req.body);
        logger.info('states updated');
        res.json({ success: true });
    } catch (error) {
        logger.error('update states failed', { error: error.message });
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info('gemini server listening', { port: PORT });
    });
}

module.exports = { app };