Carpeta `codigo_leds`

Contenido: firmware para ESP32 que conecta a AWS IoT Core y controla una tira LED WS2812B (FastLED).

Archivos importantes:
- `codigo_leds.ino`: código principal (ya incluido).
- `secrets.h`: archivo de configuración con `ssid`, `password`, `aws_endpoint`, `aws_port`, `AWS_CERT_CA`, `AWS_CERT_CRT`, `AWS_CERT_PRIVATE`. NO comites este archivo con credenciales reales.

Pasos para usar el firmware:
1. Instala el ESP32 board package en el IDE de Arduino o usa PlatformIO.
2. Coloca `secrets.h` en la misma carpeta con las constantes adecuadas (ver ejemplo abajo).
3. Selecciona la placa `ESP32 Dev Module` y el puerto COM correcto.
4. Compila y flashea.

Ejemplo básico de `secrets.h` (sin credenciales):

```cpp
#pragma once

// WiFi
const char* ssid = "TU_SSID";
const char* password = "TU_PASSWORD";

// AWS IoT
const char* aws_endpoint = "a1xqs18b49plc8-ats.iot.us-east-1.amazonaws.com";
const int aws_port = 8883;

// Certificados (PEM multiline string o incluir como archivo)
const char* AWS_CERT_CA = "---PEM CA---";
const char* AWS_CERT_CRT = "---PEM CERT---";
const char* AWS_CERT_PRIVATE = "---PEM PRIVATE KEY---";
```

Advertencias:
- No subas `secrets.h` al repositorio.
- Mantén los certificados y claves fuera del control de versiones.
