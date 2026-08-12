import { updateDeviceStatus } from '@/lib/deviceStatusDb'
import { getFiredAlarms, markAlarmTaken } from '@/lib/alarmsDb'
import { getChatId } from '@/lib/telegramDb'
import { sendTelegramMessage } from '@/lib/telegram'

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

    // Actualizar estado global del dispositivo en DynamoDB
    await updateDeviceStatus(estado, mensaje || '')
    console.log(`[WEBHOOK/IoT] Estado actualizado: ${estado} — ${mensaje}`)

    // Si el cajón fue abierto → el paciente tomó el medicamento
    if (estado === 'abierto') {
      try {
        // Buscar la alarma disparada más reciente (la que suena actualmente)
        const disparadas = await getFiredAlarms()
        if (disparadas.length > 0) {
          // Ordenar por firedAt desc y tomar la más reciente
          const masReciente = disparadas.sort(
            (a, b) => new Date(b.firedAt) - new Date(a.firedAt)
          )[0]

          await markAlarmTaken(masReciente.id)
          console.log(`[WEBHOOK/IoT] Alarma ${masReciente.id} marcada como 'taken'`)

          // Enviar confirmación por Telegram
          const chatId = await getChatId()
          if (chatId) {
            await sendTelegramMessage(
              chatId,
              `✅ <b>¡Medicamento tomado!</b>\n\n` +
              `💊 <b>${masReciente.medicamento}</b>\n` +
              `🗂 Cajón: <b>${masReciente.cajon ?? 1}</b>\n` +
              `🕐 Hora programada: <b>${masReciente.hora}</b>`
            )
          }
        }
      } catch (err) {
        // No fallar el webhook si hay error en la lógica de alarmas
        console.error('[WEBHOOK/IoT] Error al marcar alarma como tomada:', err)
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('[WEBHOOK/IoT] Error:', error)
    return Response.json({ error: 'Error procesando el webhook.' }, { status: 500 })
  }
}
