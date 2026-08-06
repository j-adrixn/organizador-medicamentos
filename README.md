# Organizador de Medicamentos IoT

Panel de control web para un dispensador de medicamentos físico basado en ESP32.
La web programa alarmas, las dispara vía MQTT a AWS IoT Core, y el ESP32 enciende una tira LED y activa un buzzer al momento indicado.

---

## Arquitectura del sistema

```
┌─────────────────────┐        MQTT (TLS)        ┌──────────────────────┐
│   Web (Next.js)     │ ──── AWS IoT Core ──────► │  ESP32 + FastLED     │
│   Vercel            │ ◄─── IoT Rule (HTTPS) ─── │  WS2812B + Buzzer    │
└────────┬────────────┘                           │  Sensor cajón (GPIO) │
         │                                        └──────────────────────┘
         │ read/write
         ▼
┌─────────────────────┐
│  DynamoDB           │
│  tabla: med-org..   │
│  - pk=ALARM         │
│  - pk=DEVICE_STATUS │
└─────────────────────┘
```

**Flujo completo:**
1. Usuario programa alarma en la web → se guarda en DynamoDB
2. Vercel Cron (cada minuto) revisa alarmas pendientes → si la hora coincide, publica MQTT
3. ESP32 recibe MQTT → enciende LEDs con el color del medicamento + activa buzzer
4. Usuario abre el cajón → ESP32 publica en `adrix/organizador/estado`
5. AWS IoT Rule reenvía el mensaje al webhook de Next.js → DynamoDB actualiza estado
6. UI muestra "Medicamento tomado" en tiempo real (polling cada 5s)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Deploy web | Vercel |
| Backend IoT | AWS IoT Core (MQTT over TLS) |
| Base de datos | AWS DynamoDB (tabla `med-organizador`) |
| Firmware | ESP32 + FastLED + PubSubClient + ArduinoJson |
| LEDs | Tira WS2812B (5 LEDs, GPIO 4) |
| Buzzer | GPIO 14 |
| Sensor cajón | GPIO 12 (INPUT_PULLUP) |

---

## Estado actual — 5 Aug 2026

| Componente | Estado | Detalle |
|---|---|---|
| 🖥️ Frontend Next.js | ✅ Listo | Build sin errores, UI completa |
| 🗄️ DynamoDB | ✅ Listo | Tabla `med-organizador` creada y probada |
| 🔑 Credenciales AWS | ✅ Configuradas | `.env.local` con access key y secret |
| 📡 MQTT Publish | ✅ Conectado | `dispararAlarma()` llama a AWS IoT Core |
| ⏰ Cron Vercel | ✅ Configurado | `vercel.json` — cada minuto revisa alarmas |
| 🔔 Webhook cajón | ✅ Listo | `/api/webhook/iot` espera la IoT Rule |
| 📊 Polling estado | ✅ Listo | UI consulta `/api/device-status` cada 5s |
| 🔌 Firmware ESP32 | ✅ Listo | `codigo_leds/codigo_leds.ino` — listo para flashear |
| ☁️ IoT Rule AWS | ⏳ Pendiente | Crear en AWS Console (ver sección más abajo) |
| 🚀 Deploy Vercel | ⏳ Pendiente | Añadir variables de entorno y hacer push |

---

## Estructura del repositorio

```
organizador-medicamentos/
│
├── src/
│   ├── app/
│   │   ├── page.js                        # UI principal (programar alarmas)
│   │   ├── layout.js                      # Layout raíz
│   │   ├── globals.css                    # Estilos base + Tailwind
│   │   └── api/
│   │       ├── alarms/
│   │       │   ├── route.js               # GET/POST alarmas (usa DynamoDB)
│   │       │   └── [id]/route.js          # DELETE alarma por ID
│   │       ├── cron/
│   │       │   └── check-alarms/route.js  # Cron Vercel — dispara alarmas a su hora
│   │       ├── device-status/route.js     # GET estado actual del ESP32
│   │       └── webhook/
│   │           └── iot/route.js           # Recibe estado cajón desde IoT Rule
│   ├── lib/
│   │   ├── dynamodb.js                    # Cliente DynamoDB (singleton)
│   │   ├── alarmsDb.js                    # CRUD alarmas en DynamoDB
│   │   └── deviceStatusDb.js             # Lee/escribe estado del dispositivo
│   └── actions/
│       └── iotActions.js                  # dispararAlarma() — publica MQTT a AWS
│
├── codigo_leds/
│   ├── codigo_leds.ino                    # Firmware ESP32 principal
│   ├── secrets.h                          # ⚠️ Certificados AWS (NO subir a Git)
│   └── README.md                          # Instrucciones de flasheo
│
├── .env.local                             # ⚠️ Credenciales (NO subir a Git)
├── vercel.json                            # Cron job: cada minuto
├── package.json
└── README.md                              # Este archivo
```

---

## Modelo de datos (DynamoDB)

Tabla única `med-organizador` con diseño de tabla única:

### Alarmas
```
pk = "ALARM"
sk = "alarm_<id>"
───────────────────────────────────────────────────────
{
  "id":          "1722906900000-a3f2",
  "medicamento": "Paracetamol",
  "color":       "#06b6d4",
  "hora":        "08:00",
  "status":      "pending" | "fired" | "cancelled",
  "createdAt":   "2026-08-05T23:55:00.000Z",
  "firedAt":     "2026-08-06T08:00:01.000Z"   // solo si fue disparada
}
```

### Estado del dispositivo
```
pk = "DEVICE_STATUS"
sk = "ESP32_ORGANIZADOR"
───────────────────────────────────────────────────────
{
  "estado":   "abierto" | "cerrado" | "desconocido",
  "mensaje":  "Medicamento tomado",
  "lastSeen": "2026-08-06T08:00:45.000Z"
}
```

---

## API Reference

### `GET /api/alarms`
Devuelve todas las alarmas ordenadas por fecha de creación (más reciente primero).

### `POST /api/alarms`
Guarda una nueva alarma. Si `dispararAhora: true`, envía la señal MQTT al instante.
```json
{
  "medicamento": "Paracetamol",
  "color": "#06b6d4",
  "hora": "08:00",
  "dispararAhora": false
}
```

### `DELETE /api/alarms/:id`
Elimina una alarma permanentemente de DynamoDB.

### `GET /api/device-status`
Devuelve el último estado conocido del ESP32 (cajón abierto/cerrado).

### `GET /api/cron/check-alarms`
Endpoint del cron job de Vercel. Requiere header `Authorization: Bearer <CRON_SECRET>`.

### `POST /api/webhook/iot`
Recibe el estado del cajón desde AWS IoT Core Rule. Requiere header `x-iot-secret: <IOT_WEBHOOK_SECRET>`.

---

## Tópicos MQTT

| Tópico | Dirección | Quién publica | Descripción |
|---|---|---|---|
| `adrix/organizador/alerta` | Web → ESP32 | Next.js (server action) | Dispara alarma con color |
| `adrix/organizador/estado` | ESP32 → Web | Firmware ESP32 | Notifica apertura/cierre del cajón |

### Payload `adrix/organizador/alerta`
```json
{
  "medicamento": "Paracetamol",
  "r": 6,
  "g": 182,
  "b": 212,
  "accion": "sonar"
}
```

### Payload `adrix/organizador/estado`
```json
{
  "estado": "abierto",
  "mensaje": "Medicamento tomado"
}
```

---

## Variables de entorno

### `.env.local` (desarrollo local)
```env
AWS_ACCESS_KEY_ID=<tu_access_key>
AWS_SECRET_ACCESS_KEY=<tu_secret_key>
AWS_IOT_ENDPOINT=a1xqs18b49plc8-ats.iot.us-east-1.amazonaws.com
AWS_REGION=us-east-1

DYNAMODB_TABLE=med-organizador

# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CRON_SECRET=<string_aleatorio_largo>
IOT_WEBHOOK_SECRET=<otro_string_aleatorio_largo>
```

> ⚠️ Las mismas variables deben estar en **Vercel Dashboard → Settings → Environment Variables** antes del deploy.

---

## Getting Started — Correr en local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar credenciales en .env.local (ver sección anterior)

# 3. Servidor de desarrollo
npm run dev
# → http://localhost:3000
```

---

## Hardware del ESP32

### Pines
| Función | GPIO |
|---|---|
| Tira LED WS2812B (Din) | 4 |
| Buzzer | 14 |
| Sensor cajón (reed switch) | 12 |

### Máquina de estados
```
MODO_NORMAL
   │ (recibe MQTT "sonar")
   ▼
ALARMA_SONANDO  ← LEDs encendidos + buzzer parpadeando
   │ (cajón abierto)
   ▼
ALARMA_SILENCIADA_ESPERANDO_CIERRE  ← LEDs encendidos, buzzer apagado
   │ (cajón cerrado)
   ▼
MODO_NORMAL
```

### Flashear el ESP32
1. Abre `codigo_leds/codigo_leds.ino` en Arduino IDE
2. Coloca `secrets.h` en la misma carpeta (nunca al repo)
3. Selecciona placa: `ESP32 Dev Module`, puerto: el COM asignado
4. Upload → Monitor Serie a `115200` baudios

### Librerías Arduino requeridas
- `FastLED`
- `PubSubClient`
- `ArduinoJson`
- `WiFiClientSecure` (incluida en el core ESP32)

---

## Deploy en Vercel

### 1. Añadir variables de entorno
En [Vercel Dashboard](https://vercel.com) → tu proyecto → **Settings → Environment Variables**, añade todas las variables del `.env.local`.

### 2. Deploy
```bash
git add .
git commit -m "feat: persistencia DynamoDB + cron + UI completa"
git push origin main
# Vercel despliega automáticamente
```

### 3. Verificar el cron
En Vercel Dashboard → tu proyecto → **Logs** → filtrar por `/api/cron/check-alarms`.

---

## Pendientes

### ⏳ IoT Rule en AWS Console (feedback del cajón)
Para que la UI muestre cuando el usuario abre el cajón:

1. Ve a **AWS IoT Core → Message Routing → Rules → Create rule**
2. **Rule name:** `organizador_estado_webhook`
3. **SQL:** `SELECT * FROM 'adrix/organizador/estado'`
4. **Action:** HTTPS → URL: `https://organizador-medicamentos.vercel.app/api/webhook/iot`
5. **Header:** `x-iot-secret` = valor de `IOT_WEBHOOK_SECRET`

### ⏳ Rotar credenciales AWS
Las credenciales actuales fueron compartidas en texto. Se recomienda:
1. Ir a **AWS IAM → Users → Security credentials**
2. Desactivar la key actual
3. Crear una nueva y actualizar `.env.local` + Vercel

### ⏳ Política IAM mínima
El usuario IAM actual tiene acceso amplio. Para producción, limitar a:
- `iot:Publish` solo al tópico `adrix/organizador/alerta`
- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem` solo en la tabla `med-organizador`

---

## Seguridad

- `.env.local` está en `.gitignore` ✅ — nunca se sube a GitHub
- `codigo_leds/secrets.h` contiene los certificados del dispositivo — no subir al repo
- Los endpoints internos (`/api/cron/` y `/api/webhook/iot`) están protegidos con secrets
- Las credenciales AWS no están embebidas en el cliente — solo se usan en Server Actions y API Routes (server-side)
