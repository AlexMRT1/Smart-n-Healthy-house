const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Certificados como cadenas de texto (reemplaza con tus certificados)
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpgIBAAKCAQEA1k89Y5L3iCrRqlom4Ayj2yHPVDU7ngWkAIbmCFe26pDEx3/O
lVoCR7Tjc3+bVftIPzTZZIkQLlUE3d2x6/Pkq9JdsH3Bbe+TuBw/i3gPwK2mfusw
5OILQ6azGtXj77mEJ9BYvLGuBGJKM2KaDTY2STaZq7yZoInvzYHWsGIfvooaQKCD
cIkV8GYbjTdnb0VMztx9KPv68KODoEUFcTwGNMP/C0VQCcBqBjn0zdqEn1InC7eq
ZvJY1iPowh3V3aO5Vz/PJm7hvvLKXqcDZgZwYNDVU+TTa+Cp8Ban3d0pMkiEyLW9
+JmX5yE3UMU3A++fvYtjcPJ6EeqzqjpRPYZqhQIDAQABAoIBAQC/QJvyXtfUhxHx
St7il6UrC/MwnQkFLtd7OOfUjiLJFkTmHOLJWjgqsf1Bt6Fyi/ufnJRdKgxsrKbZ
MN11SoTJ6cR+mtuiNmnHpj33Q0AbnVy2a0GJIUkYKI4x5qux5gdQWJi4XICFnQnG
7bm5DKZJlBZzsq4PHMoKxlJHumnF6WsOmuG9zNWUkK5qvvA5R+YMBmtKQVKSPYMF
cxi1rBnu1txJNVomHqiruSXArkVGzZDCG4AqeRS53wXKPuCoAhqw1xUJOpBLalA2
vFt2GFw1kkCnfMaRZp1+dUAZoKSfW0y3rJZ0XvKtM/+7lYOX1CEy9walqEs3NbJu
3ks5OkHBAoGBAOtfIQhIk0OgLvz35tVv+LRX4/poxl2zZhvmBj/tBDmQeUqFM6aD
SHNo0I9W+pPnvi09/nD3qiqh/Ks3G45KxFvFdv2IeQuSlI6tmTT9FA7niz76q6A3
e/QHIJs/xnYRBVKmLkXAasFTTldffzbTJ2NzaqwprKUFqjbrAiaEcdz5AoGBAOkX
jj08A3+UaN2PMIjJbxKapqToKTtr3VJsnLZnPyVaYFl2PjBlMLNPiOwxVv1B2PGM
v50ehwfWqMCCb4LNDMDNpZngomA4COqCUAW+U93WLa/wM4/ii38lyEMgVLRxbOIX
NocEx93IEOc11wJqwQAAzSZU4+dPtUC3ejwTcZjtAoGBAJYi3CM4iBc++joKt4e2
IOKInbeBVec3JA7vr1Tfjy5Y5cWPKd8xJunXFhIY3UWzMTASt1a/5B/FrDJauI0P
TCltz/TxNKUZHwHT4kJWnJDVSZEmvIs6WSrT0Qy2pZVyTf7mWeXMU0x2IybAl5kV
H67kVEr1Wlb5QhY92eVP3oGhAoGBANM3+Dm+90CVwIz84zMgrZkDMP0AL9Tbwpud
NkkHuC3l/qcywdni6EWkTeQSNcya7ba9HymGb0AIIbUIvXmey+6uq2CMMTfVryaq
XU9HEAJWweHLXT4GQPg/yYAifP9iRRN/i3bAO0jasY6CuEpFaIzTLROOG1MRZKK3
YHmt+ONlAoGBAMqmID5+5GdsUSHyhnqFUvVvkfOIwGVCA8eoGcL8E/pGEvRkYjuB
fjAUYi/C+O9GNG1WW1/bnmR1uP0l1kY2697gksWpYicdgvhI8Q7wBA202hV+Xnrl
dhE5Oaq4+HlHyIVKr25ibS5peoxPhtTe0MGKo6GCpdTBlMHI+tgtulOL
-----END RSA PRIVATE KEY-----` // Reemplaza con tu private.pem.key

const cert = `-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUW4D8fth/S6hNz6gWemA9KhyDAQswDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI1MDUwNTIzMjUy
MloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANZPPWOS94gq0apaJuAM
o9shz1Q1O54FpACG5ghXtuqQxMd/zpVaAke043N/m1X7SD802WSJEC5VBN3dsevz
5KvSXbB9wW3vk7gcP4t4D8Ctpn7rMOTiC0OmsxrV4++5hCfQWLyxrgRiSjNimg02
Nkk2mau8maCJ782B1rBiH76KGkCgg3CJFfBmG403Z29FTM7cfSj7+vCjg6BFBXE8
BjTD/wtFUAnAagY59M3ahJ9SJwu3qmbyWNYj6MId1d2juVc/zyZu4b7yyl6nA2YG
cGDQ1VPk02vgqfAWp93dKTJIhMi1vfiZl+chN1DFNwPvn72LY3DyehHqs6o6UT2G
aoUCAwEAAaNgMF4wHwYDVR0jBBgwFoAUtzYQ2z2hJsI/w9manGWama6NtwwwHQYD
VR0OBBYEFLTaifYTf2uPw8awxI7meACsrAskMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQCQmk4QgblzzyX9WpAheTZl8MeB
JzEaATdqWGJjT3yLt9somHGKZ1gy9zn6CrEIaOepmTi4iiLFreA+J+sFZir4XbkQ
aKCwgWafohrUUQ6TIRPb8S4/IDYyLwKN5Y9uBrDV9MeoASim+mxc4uxgJYIBTMf4
v7hKdV3PI/vRew24iWRaXZl2Ma1yEf/qhZctdw85OrteNXMDioJZ43GMvR9dQBho
CS1i2l4+qe+hgEAZEVHNqChCvAjVekeUFMHg3/u10+3oECtoNcLgPqRna4WPQY2d
3zHOcXd8ERA95qEXxtvyGMVcsMTQ0NESkOaErWYjSfifTo0Bx6V0B1JkxWRk
-----END CERTIFICATE-----` // Reemplaza con tu certificate.pem.crt

const ca = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----` // Reemplaza con tu AmazonRootCA1.pem

// Configuración del cliente MQTT
const options = {
  clientId: 'ESP32_CAM_PIR_NodeJS',
  host: 'acw04p2w17u4m-ats.iot.us-east-1.amazonaws.com',
  port: 8883,
  protocol: 'mqtts',
  key: privateKey,
  cert: cert,
  ca: ca,
  rejectUnauthorized: true
};

const client = mqtt.connect(options);

// Configuración del servidor web
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir una página HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pene.html');
});

// Manejar conexión MQTT
client.on('connect', () => {
  console.log('Conectado a AWS IoT Core');
  client.subscribe('/testeo', (err) => {
    if (err) {
      console.error('Error al suscribirse:', err);
    } else {
      console.log('Suscrito al topic /testeo');
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`Mensaje recibido en ${topic}: ${message.toString()}`);
  // Enviar el mensaje al cliente web
  io.emit('mqttMessage', { topic, message: message.toString() });
});

client.on('error', (err) => {
  console.error('Error:', err);
});

// Iniciar el servidor web
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor web escuchando en http://localhost:${PORT}`);
});
