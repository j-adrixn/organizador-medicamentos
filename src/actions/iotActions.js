'use server'

import { IoTDataPlaneClient, PublishCommand } from '@aws-sdk/client-iot-data-plane'

function hexToRgb(hex) {
  const sanitized = hex.replace('#', '')
  const normalized = sanitized.length === 3
    ? sanitized.split('').map((char) => char + char).join('')
    : sanitized
  const value = parseInt(normalized, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

export async function dispararAlarma(medicamento, hexColor) {
  if (!medicamento || !hexColor) {
    throw new Error('El medicamento y el color son obligatorios.')
  }

  const { r, g, b } = hexToRgb(hexColor)

  const client = new IoTDataPlaneClient({
    region: process.env.AWS_REGION,
    endpoint: `https://${process.env.AWS_IOT_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

  const payload = JSON.stringify({
    medicamento,
    r,
    g,
    b,
    accion: 'sonar',
  })

  const command = new PublishCommand({
    topic: 'adrix/organizador/alerta',
    payload: Buffer.from(payload),
    qos: 0,
  })

  await client.send(command)
}
