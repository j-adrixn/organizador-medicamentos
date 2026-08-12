import { getPendingAlarms, updateAlarmStatus } from '@/lib/alarmsDb'
import { dispararAlarma } from '@/actions/iotActions'

export async function GET(request) {
  try {
    const pendientes = await getPendingAlarms()

    if (pendientes.length === 0) {
      return Response.json({ message: 'Sin alarmas pendientes.', fired: 0 })
    }

    const ahora = new Date()
    const horaActual = ahora.toTimeString().slice(0, 5)

    const resultados = []

    for (const alarma of pendientes) {
      if (alarma.hora === horaActual) {
        try {
          await dispararAlarma(alarma.medicamento, alarma.color, alarma.cajon)
          await updateAlarmStatus(alarma.id, 'fired')
          resultados.push({ id: alarma.id, medicamento: alarma.medicamento, cajon: alarma.cajon, status: 'fired' })
        } catch (error) {
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
    return Response.json({ error: 'Error al procesar el cron.' }, { status: 500 })
  }
}