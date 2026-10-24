const express = require('express');
const axios = require('axios');
const logger = require('../server/log');
require('dotenv').config();

const app = express();
const API_KEY = process.env.ACCUWEATHER_API_KEY;
const BASE_URL = 'http://dataservice.accuweather.com';
const { mapWeatherResponse } = require('./mapWeather');

// Middleware
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

// Get weather data by location
app.get('/weather/:locationKey', async (req, res) => {
    if (!API_KEY) {
        return res.status(503).json({ error: 'Falta ACCUWEATHER_API_KEY' });
    }

    try {
        const locationKey = req.params.locationKey;
        
        // Get current conditions
        const currentConditions = await axios.get(
            `${BASE_URL}/currentconditions/v1/${locationKey}`,
            {
                params: {
                    apikey: API_KEY,
                    details: true,
                    language: 'es-es'
                }
            }
        );
        logger.info("current conditions", { locationKey });

        // Get air quality data
        const airQuality = await axios.get(
            `${BASE_URL}/airquality/v1/current/${locationKey}`,
            {
                params: {
                    apikey: API_KEY
                }
            }
        );
        logger.info("air quality", { locationKey });

        // Get alerts
        const alerts = await axios.get(
            `${BASE_URL}/alerts/v1/${locationKey}`,
            {
                params: {
                    apikey: API_KEY,
                    language: 'es-es'
                }
            }
        );
        logger.info("weather alerts", { locationKey, count: alerts.data.length });

        const weatherData = mapWeatherResponse(
            currentConditions.data[0],
            airQuality.data[0],
            alerts.data
        );

        res.json(weatherData);
    } catch (error) {
        logger.error("weather fetch failed", { error: error.message });
        res.status(500).json({ error: 'Error al obtener datos meteorológicos' });
    }
});

// Search location by query
app.get('/location/search', async (req, res) => {
    if (!API_KEY) {
        return res.status(503).json({ error: 'Falta ACCUWEATHER_API_KEY' });
    }

    const { q } = req.query;
    if (!q || !String(q).trim()) {
        return res.status(400).json({ error: 'Falta el termino de busqueda' });
    }

    try {
        logger.info("location search", { q });

        const response = await axios.get(
            `${BASE_URL}/locations/v1/cities/search`,
            {
                params: {
                    apikey: API_KEY,
                    q,
                    language: 'es-es'
                }
            }
        );
        logger.info("location results", { q, count: response.data.length });
        res.json(response.data);
    } catch (error) {
        logger.error("location search failed", { error: error.message });
        res.status(500).json({ error: 'Error al buscar ubicación' });
    }
});

const PORT = process.env.PORT || 3004;
if (require.main === module) {
    app.listen(PORT, () => {
        logger.info("weather server listening", { port: PORT });
    });
}

module.exports = { app };