import { PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE } from './dynamodb'

const PK = 'ALARM'

/**
 * Crea el objeto de alarma con todos sus campos.
 */
export function createAlarmRecord(medicamento, color, hora, cajon = 1) {
  if (!medicamento || !medicamento.trim()) throw new Error('El medicamento es obligatorio.')
  if (!color) throw new Error('El color es obligatorio.')
  if (!hora) throw new Error('La hora es obligatoria.')

  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    id,
    medicamento: medicamento.trim(),
    color,
    hora,
    cajon: Number(cajon) || 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

/**
 * Guarda una alarma en DynamoDB.
 */
export async function saveAlarm(alarm) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: PK,
      sk: `alarm_${alarm.id}`,
      ...alarm,
    },
  }))
  return alarm
}

/**
 * Devuelve todas las alarmas ordenadas por hora de creación (más reciente primero).
 */
export async function getAllAlarms() {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: {
      ':pk': PK,
      ':prefix': 'alarm_',
    },
  }))

  const items = (result.Items || []).map(({ pk, sk, ...rest }) => rest)
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Devuelve todas las alarmas con status "pending".
 */
export async function getPendingAlarms() {
  const all = await getAllAlarms()
  return all.filter((a) => a.status === 'pending')
}

/**
 * Actualiza el status de una alarma (pending | fired | cancelled).
 */
export async function updateAlarmStatus(id, status) {
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { pk: PK, sk: `alarm_${id}` },
    UpdateExpression: 'SET #s = :s, firedAt = :t',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: { ':s': status, ':t': new Date().toISOString() },
  }))
}

/**
 * Elimina una alarma permanentemente.
 */
export async function deleteAlarm(id) {
  await ddb.send(new DeleteCommand({
    TableName: TABLE,
    Key: { pk: PK, sk: `alarm_${id}` },
  }))
}
