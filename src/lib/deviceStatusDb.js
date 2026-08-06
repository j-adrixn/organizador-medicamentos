import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE } from './dynamodb'

const PK = 'DEVICE_STATUS'
const SK = 'ESP32_ORGANIZADOR'

/**
 * Actualiza el estado del dispositivo en DynamoDB.
 * @param {string} estado - 'abierto' | 'cerrado' | 'desconocido'
 * @param {string} mensaje - Mensaje descriptivo del estado
 */
export async function updateDeviceStatus(estado, mensaje) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: PK,
      sk: SK,
      estado,
      mensaje,
      lastSeen: new Date().toISOString(),
    },
  }))
}

/**
 * Lee el último estado del dispositivo desde DynamoDB.
 * Devuelve null si no hay registro.
 */
export async function getDeviceStatus() {
  const result = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: PK, sk: SK },
  }))

  if (!result.Item) return null

  const { pk, sk, ...status } = result.Item
  return status
}
