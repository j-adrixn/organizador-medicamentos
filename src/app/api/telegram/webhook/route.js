import { saveChatId } from '@/lib/telegramDb'
import { sendTelegramMessage } from '@/lib/telegram'

/**
 * Webhook que recibe los mensajes enviados al bot de Telegram.
 * Telegram necesita que este endpoint devuelva 200 siempre.
 *
 * Comandos soportados:
 *  /start → registra el chatId del usuario y envía bienvenida
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const message = body?.message

    // Si el update no contiene mensaje, ignorar
    if (!message) return Response.json({ ok: true })

    const chatId = message.chat?.id
    const text = (message.text || '').trim()

    if (!chatId) return Response.json({ ok: true })

    if (text.startsWith('/start')) {
      await saveChatId(chatId)
      await sendTelegramMessage(
        chatId,
        '💊 <b>¡Bot de Medicamentos activado!</b>\n\n' +
        'Recibirás alertas en este chat cuando:\n' +
        '• ⚠️ No se tome un medicamento a tiempo\n' +
        '• ✅ Se confirme que el medicamento fue tomado\n\n' +
        '<i>Organizador IoT — Panel web activo</i>'
      )
      console.log(`[TELEGRAM] chatId registrado: ${chatId}`)
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[TELEGRAM WEBHOOK] Error:', error)
    // Telegram requiere 200 siempre, aunque haya error interno
    return Response.json({ ok: true })
  }
}
