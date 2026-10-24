const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

test("compose starts the house and its sibling http services", () => {
    const text = fs.readFileSync(path.join(__dirname, "..", "docker-compose.yml"), "utf8");
    for (const name of ["house", "verification", "auth", "weather", "assistant"]) {
        assert.equal(new RegExp(`^  ${name}:`, "m").test(text), true, name);
    }
    for (const published of ["3000:3000", "3002:3002", "3003:3003", "3004:3004", "5000:5000"]) {
        assert.equal(text.includes(`"${published}"`), true, published);
    }
});

test("the env example names every variable read by the API", () => {
    const example = fs.readFileSync(path.join(__dirname, "..", ".env.example"), "utf8");
    const root = path.join(__dirname, "..", "API");
    const names = new Set();

    function walk(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith(".js")) {
                const source = fs.readFileSync(full, "utf8");
                for (const match of source.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
                    names.add(match[1]);
                }
            }
        }
    }

    walk(root);
    assert.equal(names.size > 0, true);
    for (const name of names) {
        assert.equal(example.includes(`${name}=`), true, name);
    }
});
