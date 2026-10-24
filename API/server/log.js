function write(level, message, fields = {}) {
    const entry = {
        time: new Date().toISOString(),
        level,
        message: message instanceof Error ? message.message : String(message),
        ...fields
    };
    const line = JSON.stringify(entry);
    if (level === "error") console.error(line);
    else console.log(line);
    return entry;
}

function info(message, fields) {
    return write("info", message, fields);
}

function error(message, fields) {
    return write("error", message, fields);
}

module.exports = { info, error };
