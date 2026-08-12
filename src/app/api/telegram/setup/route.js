/**
 * GET /api/telegram/setup
 *
 * Registra el webhook del bot de Telegram apuntando a esta misma app.
 * Solo debes llamarlo UNA VEZ después de cada deploy a producción.
 * Visita: https://tu-app.vercel.app/api/telegram/setup
 */
export async function GET(request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return Response.json(
      { error: 'TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno.' },
      { status: 500 }
    )
  }

  // Determinar la URL base de la app
  const host =
    request.headers.get('host') ||
    process.env.VERCEL_URL ||
    'localhost:3000'

  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`

  // Registrar el webhook en Telegram
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message'],
    }),
  })

  const data = await res.json()
  console.log('[TELEGRAM SETUP] setWebhook result:', data)

  return Response.json({
    webhookUrl,
    telegramResult: data,
    next: data.ok
      ? '✅ Webhook registrado. Ahora escribe /start en tu bot de Telegram.'
      : '❌ Hubo un error. Revisa que TELEGRAM_BOT_TOKEN sea correcto.',
  })
}
