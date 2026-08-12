import { getPendingAlarms, getFiredAlarms, updateAlarmStatus, markAlarmMissed } from '@/lib/alarmsDb'
import { dispararAlarma } from '@/actions/iotActions'
import { getChatId } from '@/lib/telegramDb'
import { sendTelegramMessage } from '@/lib/telegram'

// Minutos de espera antes de considerar una alarma como "no tomada"
const MISSED_MINUTES = 15

/**
 * Vercel Cron Job / cron-job.org — se ejecuta cada minuto.
 * 1. Dispara alarmas cuya hora coincide con la hora actual (Ecuador).
 * 2. Detecta alarmas disparadas hace más de MISSED_MINUTES sin confirmar → alerta Telegram.
 */
export async function GET(request) {
  // Vercel Cron añade este header automáticamente en producción.
  // En desarrollo local, la verificación se omite para facilitar pruebas.
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const ahora = new Date()
  const horaActual = ahora.toLocaleTimeString('en-GB', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
  })

  const resultados = []

  // ── PARTE 1: Disparar alarmas pendientes que coincidan con la hora ──────────
  try {
    const pendientes = await getPendingAlarms()

    for (const alarma of pendientes) {
      if (alarma.hora === horaActual) {
        try {
          await dispararAlarma(alarma.medicamento, alarma.color, alarma.cajon)
          await updateAlarmStatus(alarma.id, 'fired')
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, cajon: alarma.cajon, status: 'fired' })
          console.log(`[CRON] Alarma disparada: ${alarma.medicamento} cajón ${alarma.cajon} a las ${horaActual}`)
        } catch (err) {
          console.error(`[CRON] Error disparando alarma ${alarma.id}:`, err)
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, status: 'error', error: err.message })
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Error al revisar alarmas pendientes:', err)
  }

  // ── PARTE 2: Detectar alarmas disparadas hace >MISSED_MINUTES sin confirmar ─
  const alertasTelegram = []
  try {
    const disparadas = await getFiredAlarms()
    const chatId = await getChatId()
    const limiteMs = MISSED_MINUTES * 60 * 1000

    for (const alarma of disparadas) {
      const tiempoDesdeDisparo = ahora - new Date(alarma.firedAt)
      if (tiempoDesdeDisparo >= limiteMs) {
        try {
          await markAlarmMissed(alarma.id)
          console.log(`[CRON] Alarma marcada como perdida: ${alarma.medicamento} (id: ${alarma.id})`)

          if (chatId) {
            const horaFormateada = alarma.hora || '?'
            await sendTelegramMessage(
              chatId,
              `⚠️ <b>¡Medicamento no tomado!</b>\n\n` +
              `💊 <b>${alarma.medicamento}</b>\n` +
              `🗂 Cajón: <b>${alarma.cajon ?? 1}</b>\n` +
              `🕐 Hora programada: <b>${horaFormateada}</b>\n\n` +
              `Han pasado ${MISSED_MINUTES} minutos desde que sonó la alarma y no se detectó que se abriera el cajón.`
            )
            console.log(`[CRON] Alerta Telegram enviada para: ${alarma.medicamento}`)
          }

          alertasTelegram.push({ id: alarma.id, medicamento: alarma.medicamento, status: 'missed' })
        } catch (err) {
          console.error(`[CRON] Error procesando alarma perdida ${alarma.id}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('[CRON] Error al revisar alarmas disparadas:', err)
  }

  return Response.json({
    horaActual,
    fired: resultados.filter((r) => r.status === 'fired').length,
    missed: alertasTelegram.length,
    resultados: [...resultados, ...alertasTelegram],
  })
}