import { createAlarmRecord, saveAlarm, getAllAlarms } from '@/lib/alarmsDb'
import { dispararAlarma } from '@/actions/iotActions'

export async function GET() {
  try {
    const alarmas = await getAllAlarms()
    return Response.json(alarmas)
  } catch (error) {
    console.error('[GET /api/alarms] Error:', error)
    return Response.json({ error: 'No se pudieron cargar las alarmas.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { medicamento, color, hora, dispararAhora } = await request.json()

    const alarm = createAlarmRecord(medicamento, color, hora)
    await saveAlarm(alarm)

    // Si el usuario pidió disparar ahora, enviar MQTT inmediatamente
    if (dispararAhora) {
      try {
        await dispararAlarma(medicamento, color)
        console.log(`[POST /api/alarms] MQTT disparado inmediatamente para: ${medicamento}`)
      } catch (mqttError) {
        console.error('[POST /api/alarms] Error enviando MQTT:', mqttError)
        // No fallamos la petición completa si MQTT falla —
        // la alarma quedó guardada y el cron la ejecutará a su hora
      }
    }

    return Response.json(alarm, { status: 201 })
  } catch (error) {
    console.error('[POST /api/alarms] Error:', error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}
