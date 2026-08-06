import { getPendingAlarms, updateAlarmStatus } from '@/lib/alarmsDb'
import { dispararAlarma } from '@/actions/iotActions'

/**
 * Vercel Cron Job — se ejecuta cada minuto.
 * Compara la hora actual con la hora de cada alarma pendiente.
 * Si coincide (±1 minuto), dispara el MQTT y marca la alarma como 'fired'.
 *
 * Protegido con CRON_SECRET para evitar ejecuciones no autorizadas.
 */
export async function GET(request) {
  const secret = request.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 })
  }

  try {
    const pendientes = await getPendingAlarms()

    if (pendientes.length === 0) {
      return Response.json({ message: 'Sin alarmas pendientes.', fired: 0 })
    }

    // Hora actual en formato HH:MM (zona horaria del servidor)
    const ahora = new Date()
    const horaActual = ahora.toTimeString().slice(0, 5) // "18:30"

    const resultados = []

    for (const alarma of pendientes) {
      if (alarma.hora === horaActual) {
        try {
          await dispararAlarma(alarma.medicamento, alarma.color)
          await updateAlarmStatus(alarma.id, 'fired')
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, status: 'fired' })
          console.log(`[CRON] Alarma disparada: ${alarma.medicamento} a las ${horaActual}`)
        } catch (error) {
          console.error(`[CRON] Error disparando alarma ${alarma.id}:`, error)
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, status: 'error', error: error.message })
        }
      }
    }

    return Response.json({
      horaActual,
      alarmasRevisadas: pendientes.length,
      fired: resultados.filter((r) => r.status === 'fired').length,
      resultados,
    })
  } catch (error) {
    console.error('[CRON] Error general:', error)
    return Response.json({ error: 'Error al procesar el cron.' }, { status: 500 })
  }
}
