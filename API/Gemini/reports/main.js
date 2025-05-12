const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

let conversationHistory = [];

// Variable global para almacenar estados actuales
let currentDeviceStates = {
    temperature: "31°",
    flood: "No detectada",
    gas: "No detectada",
    humidity: "22%",
    fire: "No detectado",
    battery: "95%",
    camera: "Activa",
    security: "Inactiva",
    generalStatus: "Normal",
    alerts: "0 alertas",
    environmentalHealth: "98%"
};

function updateConversationHistory(message, isUser = true) {
    conversationHistory.push({
        content: message,
        isUser: isUser,
        timestamp: new Date().toISOString()
    });
}

function validateUserName(name) {
    if (!name || name === 'unknown user') {
        return 'Friend';
    }
    return name.trim();
}

function setupGemini(userName = '') {
    dotenv.config({ path: '../../user/Data/private/ApiKeys.env' });
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const validatedName = validateUserName(userName);

    const CONTEXT = `Importante: Estás hablando con ${validatedName}. 
    Estados actuales del sistema:
    - Temperatura: ${currentDeviceStates.temperature}
    - Inundación: ${currentDeviceStates.flood}
    - Gas: ${currentDeviceStates.gas}
    - Humedad: ${currentDeviceStates.humidity}
    - Fuego: ${currentDeviceStates.fire}
    - Batería: ${currentDeviceStates.battery}
    - Cámara: ${currentDeviceStates.camera}
    - Seguridad: ${currentDeviceStates.security}
    - Estado General: ${currentDeviceStates.generalStatus}
    - Alertas Activas: ${currentDeviceStates.alerts}
    - Salud Ambiental: ${currentDeviceStates.environmentalHealth}

    Instrucciones:
    1. Usa el nombre del usuario de forma natural en la conversación cuando sea apropiado
    2. Mantén un tono amigable pero evita saludos innecesarios después del primer mensaje
    3. Sé consistente y evita textos largos, resume a menos que el usuario solicite más detalles
    4. Mantén el contexto de la conversación y continúa naturalmente sin volver a presentarte
    5. Usa los estados del sistema para dar respuestas contextualizadas y precisas
    6. Si el usuario pregunta por algún estado, usa la información más reciente disponible
    7. Si detectas valores anormales en los estados, menciónalo proactivamente
    ${process.env.CONTEXT || 'default context'}`;

    if (!GOOGLE_API_KEY) {
        throw new Error("Please set GOOGLE_API_KEY in your environment variables");
    }

    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return { model, CONTEXT };
}

async function generateResponse(model, prompt, context) {
    try {
        updateConversationHistory(prompt, true);

        let conversationContext = "";
        if (conversationHistory.length > 0) {
            conversationContext = "Previous messages: " + conversationHistory
                .slice(-3)
                .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
                .join(" | ");
        }

        const fullPrompt = `${context}\n${conversationContext}\n${prompt}`;
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        updateConversationHistory(response, false);
        return response;
    } catch (error) {
        return `Error generating response: ${error.message}`;
    }
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
    const { sessionId } = req.body;
    conversationHistory = [];
    res.json({ status: 'success', message: 'Context cleared' });
});

app.post('/api/updateStates', (req, res) => {
    try {
        currentDeviceStates = { ...currentDeviceStates, ...req.body };
        console.log('States updated:', currentDeviceStates);
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