const { test } = require("@jest/globals");
const assert = require("node:assert/strict");
const { info, error } = require("../WWW/Dashboard/scripts/clientLog");

test("the dashboard logger prints one json line", () => {
    const lines = [];
    const original = console.log;
    console.log = (line) => lines.push(line);
    try {
        info("socket up", { attempt: 1 });
    } finally {
        console.log = original;
    }

    const entry = JSON.parse(lines.at(-1));
    assert.equal(entry.level, "info");
    assert.equal(entry.message, "socket up");
    assert.equal(entry.attempt, 1);
    assert.equal(typeof entry.time, "string");
});

test("dashboard errors keep the message field", () => {
    const lines = [];
    const original = console.error;
    console.error = (line) => lines.push(line);
    try {
        error(new Error("closed"));
    } finally {
        console.error = original;
    }

    const entry = JSON.parse(lines.at(-1));
    assert.equal(entry.level, "error");
    assert.equal(entry.message, "closed");
});
