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
