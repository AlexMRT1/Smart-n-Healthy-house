
# Smart'n healthy House

## Arranque

```bash
npm ci
npm test
npm run lint
npm run build
npm start
```

El servidor de la casa queda en el puerto 3000. No hace falta MQTT para arrancar ni para correr los tests.

Certificados del dispositivo, si vas a usar MQTT, van en `secrets/mqtt.key`, `secrets/mqtt.cert` y `secrets/mqtt.ca`. Esa carpeta no se sube.

## Tests

`npm test` corre la suite. `npm run test:coverage` exige al menos 70% de lineas en el dominio, la validacion, los logs y las metricas.

## Variables

Los nombres estan en `.env.example`. Copia ese archivo a `.env` y llena los valores en tu maquina. El ejemplo no trae secretos.

```
PORT=
CORS_ORIGIN=
MQTT_HOST=
MQTT_PORT=
MQTT_PRIVATE_KEY=
MQTT_PRIVATE_KEY_PATH=
MQTT_CERT=
MQTT_CERT_PATH=
MQTT_CA=
MQTT_CA_PATH=
ACCUWEATHER_API_KEY=
GOOGLE_API_KEY=
CONTEXT=
SMTP_USER=
SMTP_PASS=
SMTP_TLS_INSECURE=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

Puertos: casa 3000, verificacion 3002, auth 3003, clima 3004, Gemini 5000.

Como contribuir: `CONTRIBUTING.md`. Cambios: `CHANGELOG.md`.

## Arquitectura

- `API/server/domain` reglas de sensores e incidentes
- `API/server/server.js` HTTP y sockets. MQTT solo si hay certificados
- `API/Gemini/domain` contexto del asistente
- `API/Accuweather` clima
- `WWW/Dashboard/scripts/logic.js` textos del tablero

Una tarea toca un modulo. `npm test` tiene que pasar antes de cerrarla.

## AVISO DE CONFIDENCIALIDAD Y PROPIEDAD INTELECTUAL

El contenido de este documento es CONFIDENCIAL y está protegido por las leyes de propiedad intelectual aplicables. Toda la información, ideas, conceptos, diseños, metodologías, productos, procesos y cualquier otro material aquí contenido constituye propiedad intelectual exclusiva de Smart’n Healthy Home, y está destinada únicamente para el uso del destinatario autorizado.

Queda estrictamente prohibida su reproducción, distribución, divulgación, modificación, o uso no autorizado, total o parcial, por cualquier medio, sin el consentimiento previo y por escrito de Smart’n Healthy Home. La infracción de estos términos podrá dar lugar a responsabilidades legales conforme a la normativa vigente en materia de propiedad intelectual, industrial y confidencialidad.

El acceso o posesión de este documento no otorga, explícita ni implícitamente, ningún derecho de licencia o uso sobre los contenidos aquí expuestos.



![Logo](https://res.cloudinary.com/dm2uezxs1/image/upload/v1746625008/xxpfpysci8aox5z3l0k7.png)


## Proximas funciones

- Conexion total con servidor

- Mejora de Experiencia de usuario

- Chat con IA mejorado

- Invitaciones a dispositivos

- Configuraciones del dispositivo y pagina

- Ecosistema "Smart'n healthy Echosystem" 

- Tutorial

- API publica y Comercial
## Instalacion

```bash
npm ci
npm start
```

El chat local:

```bash
node API/Gemini/main.js
```
## Tecnologias

**Cliente:** CSS3, Javascript(ES6+),SVG

**Server:** Node, Express, Socket.io, MQTT.js, Dotenv, AWS LoT Core


## Aviso

**Todos las imgenes y Publicidad de la pagina Tienen que ser formato de imagen SVG, toda publicidad de los dispositivos tiene que ser en modelos 3D o SVG**



## Paletas de colores
la paleta de colores de la pagina tiene que mantener los siguientes colores.

| Categoría                        | Color                  | Código HEX / RGBA                        | Visual                                     | Descripción                         |
|----------------------------------|-------------------------|-------------------------------------------|---------------------------------------------|-------------------------------------|
| **Fondo principal (gradiente)**  | Gris claro             | `#f5f7fa`                                 | ![color](https://fakeimg.pl/16x16/f5f7fa/?text=+) | Fondo superior                      |
|                                  | Gris más oscuro        | `#e4e8ec`                                 | ![color](https://fakeimg.pl/16x16/e4e8ec/?text=+) | Fondo inferior                      |
| **Colores de acento**            | Verde brillante        | `#4CAF50`                                 | ![color](https://fakeimg.pl/16x16/4CAF50/?text=+) | Estado positivo                     |
|                                  | Naranja brillante      | `#FF9800`                                 | ![color](https://fakeimg.pl/16x16/FF9800/?text=+) | Alertas                             |
|                                  | Rojo brillante         | `#FF4444`                                 | ![color](https://fakeimg.pl/16x16/FF4444/?text=+) | Errores o salud                     |
|                                  | Rojo translúcido       | `rgba(255, 87, 87, 0.95)`                 | ![color](https://fakeimg.pl/16x16/ff5757/?text=+) | Toast de error (simulado)          |
|                                  | Azul claro             | `#4A90E2`                                 | ![color](https://fakeimg.pl/16x16/4A90E2/?text=+) | Interfaz                            |
|                                  | Azul intenso           | `#007bff`                                 | ![color](https://fakeimg.pl/16x16/007bff/?text=+) | Dispositivos                        |
| **Blanco y transparencias**      | Blanco 10%             | `rgba(255, 255, 255, 0.1)`                | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Simulado (sin transparencia)        |
|                                  | Blanco 15%             | `rgba(255, 255, 255, 0.15)`               | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Simulado (sin transparencia)        |
|                                  | Blanco 20%             | `rgba(255, 255, 255, 0.2)`                | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Simulado (sin transparencia)        |
|                                  | Blanco 25%             | `rgba(255, 255, 255, 0.25)`               | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Simulado (sin transparencia)        |
|                                  | Blanco 30%             | `rgba(255, 255, 255, 0.3)`                | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Simulado (sin transparencia)        |
| **Widgets (estados)**            | Verde translúcido      | `rgba(76, 175, 80, 0.1)`                  | ![color](https://fakeimg.pl/16x16/edf7ed/?text=+) | Estado (simulado)                  |
|                                  | Naranja translúcido    | `rgba(255, 152, 0, 0.1)`                  | ![color](https://fakeimg.pl/16x16/fff3e0/?text=+) | Alerta (simulado)                  |
|                                  | Rojo translúcido       | `rgba(255, 68, 68, 0.1)`                  | ![color](https://fakeimg.pl/16x16/ffeaea/?text=+) | Salud (simulado)                   |
| **Otros destacados**             | Plano habitaciones     | `#ffffff`                                 | ![color](https://fakeimg.pl/16x16/ffffff/?text=+) | Blanco puro                         |
|                                  | Azul translúcido       | `rgba(74, 144, 226, 0.3)`                 | ![color](https://fakeimg.pl/16x16/b3d5f5/?text=+) | Plano (simulado translúcido)       |

## Appendix
En la carpeta Assets estan ubicados logos y animaciones SVG, todas las imagenes SVG se guardaran ahi


## Filosofía de Diseño - Smart'n Healthy House App y promocionamiento



##  Paradigma de Diseño

- **Neomorfismo Moderno:** Evolución del skeumorfismo y flat design.  
- **Glassmorfismo:** Efectos de cristal con fondos difuminados.  
- **Minimalismo Funcional:** Solo elementos esenciales, sin decoraciones innecesarias.  

## Sistema de Animaciones

- **Microinteracciones:** Feedback sutil y natural.  
- **Transiciones Suaves:** Curvas *easing* naturales (`cubic-bezier`).  
- **Performance First:** Optimización vía `transform` y `opacity` para uso eficiente de GPU.  
- **Reducción de Motion:** Respeto a `prefers-reduced-motion` del usuario.  

##  Sistema de Layout

- **CSS Grid Avanzado:** Rejilla flexible y adaptable.  
- **Contenedores Fluidos:** Uso de unidades relativas y `clamp()`.  
- **Sistema de Capas:** Organización con `z-index` estratégico.  
- **Espaciado Consistente:** Variables CSS para `padding` y `margin`.  

##  Filosofía de Responsividad

- **Mobile First:** Diseño base orientado a dispositivos móviles.  
- **Breakpoints Flexibles:** Definidos por contenido, no por dispositivos.  
- **Layout Adaptativo:** Reorganización dinámica del contenido.  
- **Tipografía Fluida:** Escalado de texto con `clamp()`.  

##  Principios de Interacción

- **Estado Persistente:** Feedback visual constante y predecible.  
- **Gestos Naturales:** Interacciones basadas en comportamientos móviles.  
- **Jerarquía Clara:** Diferenciación visual entre estados.  
- **Accesibilidad Integrada:** No como algo opcional, sino esencial.  

##  Sistema de Color

- **Neutros Dominantes:** Base en grises, blancos y fondos suaves.  
- **Acentos Funcionales:** Colores específicos para acciones y estados.  
- **Transparencias Significativas:** Uso del canal alpha para jerarquía visual.  
- **Alto Contraste:** Cumplimiento de estándares WCAG.  

##  Consistencia Visual

- **Sistema de Componentes:** Elementos reutilizables como tarjetas y widgets.  
- **Tokens de Diseño:** Variables CSS para valores clave (colores, tamaños, etc.).  
- **Elevación Coherente:** Uso uniforme de sombras para profundidad.  
- **Bordes y Radios:** Sistema consistente de redondeo.  

##  Rendimiento y Optimización

- **Lazy Loading:** Carga progresiva de contenido.  
- **CSS Modular:** Estructura basada en componentes.  
- **Optimización de Assets:** Uso de SVGs y compresión eficiente.  
- **Caché Estratégico:** Uso inteligente del almacenamiento local.  

##  Experiencia Progresiva

- **Estados de Carga:** Feedback visual durante operaciones asíncronas.  
- **Fallbacks Elegantes:** Degradación funcional con estilo.  
- **Offline First:** Funcionalidad básica incluso sin conexión.  
- **Actualizaciones Suaves:** Transiciones limpias entre estados de datos.  

---

Esta filosofía prioriza una experiencia moderna, eficiente y accesible, manteniendo un alto nivel de sofisticación visual y funcional.


## Aviso

**No listo para publicacion a web**
