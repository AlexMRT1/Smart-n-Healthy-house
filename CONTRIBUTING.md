# Contribuir

1. Crea la rama desde `development`.
2. Instala dependencias con `npm ci`.
3. Corre las verificaciones locales: `npm test`, `npm run test:coverage`, `npm run lint`, `npm run typecheck` y `npm run build`.
4. No subas `.env`, certificados ni llaves. Los nombres vacíos están en `.env.example`.
5. El mensaje del commit usa el estilo convencional: `fix:`, `feat:`, `docs:`, `test:`, `ci:`, `chore:`.
6. Abre un Pull Request utilizando la plantilla predeterminada y vincula el issue correspondiente (`Closes #ID`).

Una tarea toca un módulo. Si el cambio mueve un puerto o una variable, actualiza `README.md` y `CHANGELOG.md`.
