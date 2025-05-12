const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const API_KEY = process.env.ACCUWEATHER_API_KEY;
const BASE_URL = 'http://dataservice.accuweather.com';

// Middleware
app.use(express.json());

// Get weather data by location
app.get('/weather/:locationKey', async (req, res) => {
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
        console.log('\n=== Condiciones Actuales ===');
        console.log('Temperatura:', currentConditions.data[0].Temperature);
        console.log('Sensación térmica:', currentConditions.data[0].RealFeelTemperature);
        console.log('Índice UV:', currentConditions.data[0].UVIndex);
        console.log('Estado del tiempo:', currentConditions.data[0].WeatherText);

        // Get air quality data
        const airQuality = await axios.get(
            `${BASE_URL}/airquality/v1/current/${locationKey}`,
            {
                params: {
                    apikey: API_KEY
                }
            }
        );
        console.log('\n=== Calidad del Aire ===');
        console.log('Índice de calidad:', airQuality.data[0].Category);
        console.log('Valor del índice:', airQuality.data[0].Index);

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
        console.log('\n=== Alertas Meteorológicas ===');
        if (alerts.data.length > 0) {
            alerts.data.forEach((alert, index) => {
                console.log(`Alerta ${index + 1}:`, alert.Text);
            });
        } else {
            console.log('No hay alertas activas');
        }

        const weatherData = {
            current: {
                temperature: currentConditions.data[0].Temperature,
                realFeel: currentConditions.data[0].RealFeelTemperature,
                uvIndex: currentConditions.data[0].UVIndex,
                uvIndexText: currentConditions.data[0].UVIndexText,
                weatherText: currentConditions.data[0].WeatherText
            },
            airQuality: airQuality.data[0],
            alerts: alerts.data
        };

        res.json(weatherData);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error al obtener datos meteorológicos' });
    }
});

// Search location by query
app.get('/location/search', async (req, res) => {
    try {
        const { q } = req.query;
        console.log('\n=== Búsqueda de ubicación ===');
        console.log('Término de búsqueda:', q);
        
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
        console.log('Resultados encontrados:', response.data.length);
        response.data.forEach((location, index) => {
            console.log(`\nResultado ${index + 1}:`);
            console.log('Ciudad:', location.LocalizedName);
            console.log('País:', location.Country.LocalizedName);
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error al buscar ubicación' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});