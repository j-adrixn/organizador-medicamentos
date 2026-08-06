import { deleteAlarm } from '@/lib/alarmsDb'

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return Response.json({ error: 'ID requerido.' }, { status: 400 })
    }

    await deleteAlarm(id)
    return Response.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[DELETE /api/alarms/[id]] Error:', error)
    return Response.json({ error: 'No se pudo eliminar la alarma.' }, { status: 500 })
  }
}
