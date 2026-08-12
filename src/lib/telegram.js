/**
 * Envía un mensaje de texto a un chat de Telegram via Bot API.
 * @param {string|number} chatId - ID del chat destino
 * @param {string} text - Texto del mensaje (soporta HTML básico)
 */
export async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN no configurado, mensaje omitido.')
    return null
  }
  if (!chatId) {
    console.warn('[Telegram] chatId no disponible, mensaje omitido.')
    return null
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`[Telegram] API error ${res.status}: ${errorText}`)
  }

  return res.json()
}
