import { getDeviceStatus } from '@/lib/deviceStatusDb'

/**
 * Devuelve el último estado conocido del ESP32.
 * La UI hace polling cada 5 segundos a este endpoint.
 */
export async function GET() {
  try {
    const status = await getDeviceStatus()
    return Response.json(status ?? { estado: 'desconocido', mensaje: 'Sin datos aún.', lastSeen: null })
  } catch (error) {
    console.error('[GET /api/device-status] Error:', error)
    return Response.json({ estado: 'error', mensaje: 'Error leyendo estado.' }, { status: 500 })
  }
}
