# Changelog

## 1.2.0

- Gas, fuego e inundacion cuentan como alerta y suben el estado a critico.
- `/health` informa uptime, sockets y el estado de MQTT.
- Logs JSON via pino.
- Auth arranca sin Firebase y responde 503 hasta que esten las credenciales.
- Verificacion, clima y asistente exponen `/health` y Compose los levanta junto a la casa.

## 1.1.0

- Logs en JSON, contador en `/metrics` y validacion de los POST.
- `main.js` y `status.js` partidos para bajar de 500 lineas.
- Cobertura, typecheck, auditoria y build de imagen en CI.
- Compose para levantar el servidor de la casa.
- `bcryptjs`, `firebase` de cliente y el paquete `crypto` salen de las dependencias.
