const helmetModule = require("helmet");
const helmet = /** @type {(options?: object) => import("express").RequestHandler} */ (
    helmetModule.default || helmetModule
);
const cors = require("cors");
const express = require("express");
const metrics = require("./metrics");

function applyApiDefaults(app, options = {}) {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(cors({
        origin: options.origin || process.env.CORS_ORIGIN || "*",
        methods: options.methods || ["GET", "POST", "OPTIONS"],
        credentials: Boolean(options.credentials),
        allowedHeaders: options.allowedHeaders
    }));
    app.use(express.json({ limit: "100kb" }));
    app.use((req, res, next) => {
        metrics.hit(req.method);
        next();
    });
}

module.exports = { applyApiDefaults };
