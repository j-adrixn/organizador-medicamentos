import { getPendingAlarms, updateAlarmStatus } from '@/lib/alarmsDb'
import { dispararAlarma } from '@/actions/iotActions'

/**
 * Vercel Cron Job — se ejecuta cada minuto.
 * Compara la hora actual de Ecuador con la hora de cada alarma pendiente.
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

  try {
    const pendientes = await getPendingAlarms()

    if (pendientes.length === 0) {
      return Response.json({ message: 'Sin alarmas pendientes.', fired: 0 })
    }

    // Obtenemos la hora actual ajustada exactamente a la zona horaria de Ecuador (HH:MM)
    const ahora = new Date()
    const horaActual = ahora.toLocaleTimeString('en-GB', {
      timeZone: 'America/Guayaquil',
      hour: '2-digit',
      minute: '2-digit',
    })

    const resultados = []

    for (const alarma of pendientes) {
      if (alarma.hora === horaActual) {
        try {
          // Dispara el MQTT incluyendo el cajón correspondiente
          await dispararAlarma(alarma.medicamento, alarma.color, alarma.cajon)
          
          await updateAlarmStatus(alarma.id, 'fired')
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, cajon: alarma.cajon, status: 'fired' })
          console.log(`[CRON] Alarma disparada: ${alarma.medicamento} en cajón ${alarma.cajon} a las ${horaActual}`)
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