const test = require("node:test");
const assert = require("node:assert/strict");
const logger = require("../API/server/log");
const metrics = require("../API/server/metrics");

test("logger prints one json line", () => {
    const lines = [];
    const original = console.log;
    console.log = (line) => lines.push(line);
    try {
        logger.info("house up", { port: 3000 });
    } finally {
        console.log = original;
    }

    const entry = JSON.parse(lines.at(-1));
    assert.equal(entry.level, "info");
    assert.equal(entry.message, "house up");
    assert.equal(entry.port, 3000);
    assert.equal(typeof entry.time, "string");
});

test("metrics count requests and failures", () => {
    const before = metrics.snapshot();
    metrics.hit("POST");
    metrics.fail();
    const after = metrics.snapshot();
    assert.equal(after.requests, before.requests + 1);
    assert.equal(after.posts, before.posts + 1);
    assert.equal(after.errors, before.errors + 1);
});
