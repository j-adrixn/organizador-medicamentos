import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { ddb, TABLE } from './dynamodb'

const PK = 'TELEGRAM'
const SK = 'CHAT_CONFIG'

/**
 * Guarda el chatId del usuario en DynamoDB.
 * Se llama automáticamente cuando el usuario escribe /start al bot.
 */
export async function saveChatId(chatId) {
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: PK,
      sk: SK,
      chatId: String(chatId),
      registeredAt: new Date().toISOString(),
    },
  }))
}

/**
 * Recupera el chatId registrado del usuario.
 * Devuelve null si aún no se ha registrado ningún chat.
 */
export async function getChatId() {
  const result = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { pk: PK, sk: SK },
  }))
  return result.Item?.chatId ?? null
}
