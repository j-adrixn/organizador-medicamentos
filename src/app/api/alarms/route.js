import { createAlarmRecord } from '@/lib/alarms'

const alarmas = []

export async function GET() {
  return Response.json(alarmas)
}

export async function POST(request) {
  try {
    const { medicamento, color, hora } = await request.json()
    const registro = createAlarmRecord(medicamento, color, hora)
    alarmas.unshift(registro)

    return Response.json(registro, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
