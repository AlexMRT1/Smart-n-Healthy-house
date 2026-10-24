# Contribuir

1. Crea la rama desde `development`.
2. Instala con `npm ci`.
3. Corre `npm test`, `npm run test:coverage`, `npm run lint`, `npm run typecheck` y `npm run build`.
4. No subas `.env`, certificados ni llaves. Los nombres vacios estan en `.env.example`.
5. El mensaje del commit usa el estilo convencional: `fix:`, `feat:`, `docs:`, `test:`, `ci:`, `chore:`.

Una tarea toca un modulo. Si el cambio mueve un puerto o una variable, actualiza `README.md` y `CHANGELOG.md`.
