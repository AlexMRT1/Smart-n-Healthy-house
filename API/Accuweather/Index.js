const express = require("express");
const axios = require("axios");
const { query, validationResult } = require("express-validator");
const logger = require("../server/log");
const { mapWeatherResponse } = require("./mapWeather");

require("dotenv").config();

const BASE_URL = "http://dataservice.accuweather.com";

function createWeatherApp(options = {}) {
    const client = options.client || axios;
    const apiKey = () => (options.apiKey !== undefined ? options.apiKey : process.env.ACCUWEATHER_API_KEY);
    const app = express();

    app.use(express.json());

    app.get("/health", (req, res) => {
        res.json({ ok: true });
    });

    app.get("/weather/:locationKey", async (req, res) => {
        const key = apiKey();
        if (!key) {
            return res.status(503).json({ error: "Falta ACCUWEATHER_API_KEY" });
        }

        try {
            const locationKey = req.params.locationKey;
            const currentConditions = await client.get(
                `${BASE_URL}/currentconditions/v1/${locationKey}`,
                { params: { apikey: key, details: true, language: "es-es" } }
            );
            logger.info("current conditions", { locationKey });

            const airQuality = await client.get(
                `${BASE_URL}/airquality/v1/current/${locationKey}`,
                { params: { apikey: key } }
            );
            logger.info("air quality", { locationKey });

            const alerts = await client.get(
                `${BASE_URL}/alerts/v1/${locationKey}`,
                { params: { apikey: key, language: "es-es" } }
            );
            logger.info("weather alerts", { locationKey, count: alerts.data.length });

            res.json(mapWeatherResponse(
                currentConditions.data[0],
                airQuality.data[0],
                alerts.data
            ));
        } catch (error) {
            logger.error("weather fetch failed", { error: error.message });
            res.status(500).json({ error: "Error al obtener datos meteorológicos" });
        }
    });

    app.get("/location/search", query("q").optional().isString(), async (req, res) => {
        const key = apiKey();
        if (!key) {
            return res.status(503).json({ error: "Falta ACCUWEATHER_API_KEY" });
        }

        const checked = validationResult(req);
        const q = req.query.q;
        if (!checked.isEmpty() || !q || !String(q).trim()) {
            return res.status(400).json({ error: "Falta el termino de busqueda" });
        }

        try {
            logger.info("location search", { q });
            const response = await client.get(
                `${BASE_URL}/locations/v1/cities/search`,
                { params: { apikey: key, q, language: "es-es" } }
            );
            logger.info("location results", { q, count: response.data.length });
            res.json(response.data);
        } catch (error) {
            logger.error("location search failed", { error: error.message });
            res.status(500).json({ error: "Error al buscar ubicación" });
        }
    });

    return app;
}

const app = createWeatherApp();
const PORT = process.env.PORT || 3004;
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info("weather server listening", { port: PORT });
    });
}

module.exports = { app, createWeatherApp };
