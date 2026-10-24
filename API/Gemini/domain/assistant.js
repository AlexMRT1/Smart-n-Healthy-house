// Contexto, historial y estados que arma el asistente

const DEFAULT_DEVICE_STATES = {
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

function createSession(states = DEFAULT_DEVICE_STATES) {
    return {
        history: [],
        states: { ...states }
    };
}

function validateUserName(name) {
    if (!name || name === "unknown user") {
        return "Friend";
    }
    return name.trim();
}

function recordMessage(session, message, isUser = true) {
    session.history.push({
        content: message,
        isUser,
        timestamp: new Date().toISOString()
    });
}

function recentTranscript(session, limit = 3) {
    if (session.history.length === 0) {
        return "";
    }

    return "Previous messages: " + session.history
        .slice(-limit)
        .map((msg) => `${msg.isUser ? "User" : "Assistant"}: ${msg.content}`)
        .join(" | ");
}

function buildContext(userName, states, extraContext) {
    const validatedName = validateUserName(userName);

    return `Importante: Estás hablando con ${validatedName}. 
    Estados actuales del sistema:
    - Temperatura: ${states.temperature}
    - Inundación: ${states.flood}
    - Gas: ${states.gas}
    - Humedad: ${states.humidity}
    - Fuego: ${states.fire}
    - Batería: ${states.battery}
    - Cámara: ${states.camera}
    - Seguridad: ${states.security}
    - Estado General: ${states.generalStatus}
    - Alertas Activas: ${states.alerts}
    - Salud Ambiental: ${states.environmentalHealth}

    Instrucciones:
    1. Usa el nombre del usuario de forma natural en la conversación cuando sea apropiado
    2. Mantén un tono amigable pero evita saludos innecesarios después del primer mensaje
    3. Sé consistente y evita textos largos, resume a menos que el usuario solicite más detalles
    4. Mantén el contexto de la conversación y continúa naturalmente sin volver a presentarte
    5. Usa los estados del sistema para dar respuestas contextualizadas y precisas
    6. Si el usuario pregunta por algún estado, usa la información más reciente disponible
    7. Si detectas valores anormales en los estados, menciónalo proactivamente
    ${extraContext || "default context"}`;
}

function buildPrompt(context, session, prompt) {
    return `${context}\n${recentTranscript(session)}\n${prompt}`;
}

function clearHistory(session) {
    session.history = [];
}

function mergeStates(current, patch) {
    return { ...current, ...patch };
}

async function runGeneration(session, model, prompt, context) {
    try {
        recordMessage(session, prompt, true);
        const fullPrompt = buildPrompt(context, session, prompt);
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();
        recordMessage(session, response, false);
        return { response, fullPrompt };
    } catch (error) {
        return {
            response: `Error generating response: ${error.message}`,
            fullPrompt: null
        };
    }
}

module.exports = {
    DEFAULT_DEVICE_STATES,
    createSession,
    validateUserName,
    recordMessage,
    recentTranscript,
    buildContext,
    buildPrompt,
    clearHistory,
    mergeStates,
    runGeneration
};
