const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const skip = new Set(["node_modules", ".history", "secrets", ".git"]);

function walk(dir, files) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (entry.name.endsWith(".js")) files.push(full);
    }
}

const files = [];
walk(process.cwd(), files);
let failed = 0;

for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) {
        failed += 1;
        process.stderr.write(`${file}\n${result.stderr || result.stdout}\n`);
    }
}

if (failed > 0) {
    console.error(`Syntax check failed in ${failed} files`);
    process.exit(1);
}

console.log(`Syntax check passed for ${files.length} files`);
