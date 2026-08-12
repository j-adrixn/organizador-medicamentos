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
    const body = await request.json()
    let { medicamento, color, hora, cajon, dispararAhora } = body

    if (!medicamento || !hora) {
      return Response.json({ error: 'Faltan datos obligatorios (medicamento u hora).' }, { status: 400 })
    }

    // Asegurar que la hora tenga formato HH:MM limpio (por si el input manda segundos)
    if (hora.length > 5) {
      hora = hora.slice(0, 5)
    }

    const cajonNum = Number(cajon) || 1

    // Creamos y guardamos el registro en la base de datos
    const alarm = createAlarmRecord(medicamento, color, hora, cajonNum)
    await saveAlarm(alarm)

    if (dispararAhora) {
      try {
        await dispararAlarma(medicamento, color, cajonNum)
        console.log(`[POST /api/alarms] MQTT disparado inmediatamente para: ${medicamento} en cajón ${cajonNum}`)
      } catch (mqttError) {
        console.error('[POST /api/alarms] Error enviando MQTT:', mqttError)
      }
    }

    return Response.json(alarm, { status: 201 })
  } catch (error) {
    console.error('[POST /api/alarms] Error:', error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}