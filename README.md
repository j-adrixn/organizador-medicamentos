# Organizador de Medicamentos IoT

## Resumen del proyecto
Este proyecto es un panel de control web construido con Next.js 14 (App Router) y Tailwind CSS para un prototipo de organizador de medicamentos IoT.

## Qué hicimos

### 1. Inicialización del proyecto
- Se creó el proyecto en `c:\Users\adrix\OneDrive\Desktop\titulacion\organizador-medicamentos`.
- Se configuró `package.json` con dependencias de `next`, `react`, `react-dom`, `tailwindcss`, `postcss` y `autoprefixer`.
- Se creó `.gitignore` y se inicializó el repositorio Git.
- Se creó la rama `main` y se hizo el primer commit.

### 2. Configuración de Tailwind CSS
- Se agregó `tailwind.config.js` y `postcss.config.js`.
- Se creó `src/app/globals.css` con las directivas de Tailwind.
- Se creó `src/app/layout.js` para cargar `globals.css`.

### 3. Frontend del panel
- Se creó `src/app/page.js` con un Client Component de Next.js.
- La UI incluye:
  - input de texto para el nombre del medicamento
  - input `type="color"` para el color de alerta
  - input `type="time"` para la hora de la alarma
  - botón `Programar Alarma`
  - mensajes de estado de éxito/error
- El diseño se mantiene en fondo oscuro `bg-slate-950` con acentos `cyan`.

### 4. Backend / Server Action
- Se creó `src/actions/iotActions.js` con `dispararAlarma(medicamento, hexColor)`.
- La acción usa `@aws-sdk/client-iot-data-plane` para publicar en el tópico MQTT `adrix/organizador/alerta`.
- Se configuró el cliente AWS IoT Data Plane con variables de entorno.

### 5. GitHub y Vercel
- Se inicializó el repositorio Git local.
- Se creó el remoto en GitHub (`https://github.com/j-adrixn/organizador-medicamentos.git`).
- Se subió el proyecto a la rama `main`.
- Se desplegó manualmente en Vercel en `https://organizador-medicamentos.vercel.app`.

### 6. Variables de entorno
Se creó `.env.local` con las siguientes variables vacías para rellenar:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_IOT_ENDPOINT=a1xqs18b49plc8-ats.iot.us-east-1.amazonaws.com
AWS_REGION=us-east-1
```

## Qué está funcionando
- El panel web carga en Vercel.
- El formulario permite programar una alarma y muestra mensaje de éxito.
- La lógica actual en la UI está en modo simulado con `console.log`.

## Pendientes

### A corto plazo
- [ ] Verificar y configurar las variables de entorno en Vercel.
- [ ] Decidir si el botón `Programar Alarma` debe:
  - llamar a `dispararAlarma` y enviar MQTT inmediatamente, o
  - guardar la alarma programada en una base de datos y ejecutar en el horario.

### A mediano plazo
- [ ] Si se decide enviar MQTT desde la web, reactivar `dispararAlarma` en `src/app/page.js`.
- [ ] Añadir persistencia para la programación real de alarmas (API route / base de datos).
- [ ] Crear un worker o un cron job para ejecutar alarmas en el horario programado.

### IoT device
- [ ] Usar los certificados generados en AWS IoT Core (`Device_certificate.crt`, `private.key`, `AmazonRootCA*.pem`) solo en el dispositivo IoT.
- [ ] Asegurar que el certificado esté activo y asociado a la Thing y a la policy.

## Recomendaciones
- No subir `.env.local` a GitHub.
- Mantener las keys y certificados seguros.
- Usar Vercel Dashboard para añadir las variables de entorno necesarias y revisar logs.

## Firmware ESP32 (codigo_leds)

Se añadió la carpeta `codigo_leds` con el firmware para ESP32 que se conecta a AWS IoT Core y controla una tira LED WS2812B.

- `codigo_leds/codigo_leds.ino`: firmware principal.
- `codigo_leds/README.md`: instrucciones y ejemplo de `secrets.h` (no incluye credenciales).

Recuerda no añadir `codigo_leds/secrets.h` al repositorio con credenciales reales. Mira `.gitignore`.

## Guía rápida: Flasheo del ESP32 y verificación

Estas instrucciones ayudan a flashear el firmware `codigo_leds/codigo_leds.ino` en un ESP32 y a verificar la conexión con AWS IoT.

Requisitos
- Arduino IDE (o `arduino-cli`) o PlatformIO
- Cable USB para tu ESP32
- `secrets.h` configurado con tu `ssid`, `password` y certificados

Pasos (Arduino IDE)
1. Abre `codigo_leds/codigo_leds.ino` en el Arduino IDE.
2. Coloca `secrets.h` en la misma carpeta del sketch (no subirlo al repo).
3. Selecciona la placa apropiada (`ESP32 Dev Module`) y el puerto COM.
4. Pulsa `Upload` y abre el Monitor Serie a `115200` baudios para ver logs.

Pasos (PlatformIO)
1. Crea un proyecto nuevo para tu placa ESP32 o reutiliza uno existente.
2. Copia `codigo_leds.ino` y `secrets.h` al directorio `src` del proyecto PlatformIO.
3. Compila y sube con:

```bash
pio run -t upload -e <env_name>
```

Verificación
- Abre el Monitor Serie a `115200` y verifica mensajes de conexión Wi‑Fi y sincronización de hora.
- Observa suscripción al tópico `adrix/organizador/alerta` y logs de eventos.

Consejos para certificados
- Coloca los archivos `Device_certificate.crt`, `private.key` y `AmazonRootCA*.pem` en la carpeta local del dispositivo si tu flujo lo requiere.
- Nunca subas esos archivos al repositorio. `codigo_leds/secrets.h` puede contener el contenido PEM como string o puedes cargar los archivos desde el sistema de archivos del dispositivo.

## Conectar el frontend para envío MQTT real

Actualmente el proyecto incluye la función `dispararAlarma` en `src/actions/iotActions.js` que publica en AWS IoT. Para activar el envío real desde la UI:

1. Rellena las variables de entorno en Vercel o en tu `.env.local` (NO subirlas a GitHub):

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_IOT_ENDPOINT=a1xqs18b49plc8-ats.iot.us-east-1.amazonaws.com
AWS_REGION=us-east-1
```

2. En `src/app/page.js` reemplaza el flujo simulado por una llamada a la server action `dispararAlarma` (o usa `fetch` a una API server-side que invoque esa acción). Ten en cuenta que publicar directamente desde un cliente público no es seguro; usa acciones del servidor o un backend con credenciales.

Ejemplo rápido (Server Action desde Next.js App Router):

```js
// En un componente/client file
import { dispararAlarma } from '@/actions/iotActions'

// llamar desde un form handler en el servidor o usar fetch a una ruta API
await fetch('/api/trigger', { method: 'POST', body: JSON.stringify({ medicamento, color }) })
```

3. Verifica en el dispositivo ESP32 (Monitor Serie) que llega el mensaje MQTT y que enciende la tira LED.

## Qué hacer ahora (recomendado)
- Añadir la política mínima en AWS IAM para permitir `iot:Publish` solamente al tópico usado.
- Revisar que las credenciales usadas por el servidor nunca estén embebidas en el cliente.
- Si quieres, puedo añadir una guía paso-a-paso para crear la Thing y generar certificados en AWS IoT Core.

---

