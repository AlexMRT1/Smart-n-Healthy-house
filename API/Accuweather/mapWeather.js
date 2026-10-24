// Arma la respuesta publica del clima

function mapWeatherResponse(current, airQuality, alerts) {
    return {
        current: {
            temperature: current.Temperature,
            realFeel: current.RealFeelTemperature,
            uvIndex: current.UVIndex,
            uvIndexText: current.UVIndexText,
            weatherText: current.WeatherText
        },
        airQuality,
        alerts
    };
}

module.exports = {
    mapWeatherResponse
};
