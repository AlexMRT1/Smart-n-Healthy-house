// Incidentes del dia local y armado de reportes

function isToday(date, now = new Date()) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return false;

    return value.getDate() === now.getDate() &&
        value.getMonth() === now.getMonth() &&
        value.getFullYear() === now.getFullYear();
}

function filterIncidentsForToday(incidents, now = new Date()) {
    if (!Array.isArray(incidents)) return [];
    return incidents.filter((incident) => isToday(incident && incident.date, now));
}

function incidentFromHttp(body, now = new Date()) {
    return {
        ...body,
        date: now
    };
}

function incidentFromSocket(payload, now = new Date()) {
    return {
        ...payload,
        date: now
    };
}

function incidentFromMqtt(payload, now = new Date()) {
    return {
        ...payload,
        date: payload.date || now
    };
}

module.exports = {
    isToday,
    filterIncidentsForToday,
    incidentFromHttp,
    incidentFromSocket,
    incidentFromMqtt
};
