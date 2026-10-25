const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { Writable } = require("stream");
const logger = require("../API/server/log");

function capture() {
    const lines = [];
    const destination = new Writable({
        write(chunk, encoding, callback) {
            lines.push(chunk.toString());
            callback();
        }
    });
    return { lines, logger: logger.createLogger(destination) };
}

test("logger prints one json line", () => {
    const captured = capture();
    captured.logger.info("house up", { port: 3000 });

    const entry = JSON.parse(captured.lines.at(-1));
    assert.equal(entry.level, "info");
    assert.equal(entry.message, "house up");
    assert.equal(entry.port, 3000);
    assert.equal(typeof entry.time, "string");
});

test("logger errors keep the same shape", () => {
    const captured = capture();
    captured.logger.error(new Error("boom"), { port: 1 });

    const entry = JSON.parse(captured.lines.at(-1));
    assert.equal(entry.level, "error");
    assert.equal(entry.message, "boom");
    assert.equal(entry.port, 1);
});
