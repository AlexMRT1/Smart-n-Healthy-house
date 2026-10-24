const pino = require("pino");

function createLogger(destination = process.stdout) {
    const log = pino({
        level: "info",
        base: null,
        messageKey: "message",
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level(label) {
                return { level: label };
            }
        }
    }, destination);

    function write(method, message, fields = {}) {
        const text = message instanceof Error ? message.message : String(message);
        log[method](fields, text);
        return { level: method === "error" ? "error" : "info", message: text, ...fields };
    }

    return {
        info(message, fields) {
            return write("info", message, fields);
        },
        error(message, fields) {
            return write("error", message, fields);
        }
    };
}

const logger = createLogger();
logger.createLogger = createLogger;

module.exports = logger;
