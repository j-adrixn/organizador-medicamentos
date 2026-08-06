import { updateDeviceStatus } from '@/lib/deviceStatusDb'

/**
 * Endpoint HTTPS al que la IoT Rule de AWS envía los mensajes
 * publicados en el tópico 'adrix/organizador/estado'.
 *
 * Configurar en AWS IoT Core:
 * - SQL: SELECT * FROM 'adrix/organizador/estado'
 * - Action: HTTPS POST → https://<tu-dominio>/api/webhook/iot
 * - Header: x-iot-secret: <valor de IOT_WEBHOOK_SECRET>
 */
export async function POST(request) {
  const secret = request.headers.get('x-iot-secret')
  if (secret !== process.env.IOT_WEBHOOK_SECRET) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { estado, mensaje } = body

    if (!estado) {
      return Response.json({ error: 'Campo "estado" requerido.' }, { status: 400 })
    }

    await updateDeviceStatus(estado, mensaje || '')

    console.log(`[WEBHOOK/IoT] Estado actualizado: ${estado} — ${mensaje}`)
    return Response.json({ success: true })
  } catch (error) {
    console.error('[WEBHOOK/IoT] Error:', error)
    return Response.json({ error: 'Error procesando el webhook.' }, { status: 500 })
  }
}
