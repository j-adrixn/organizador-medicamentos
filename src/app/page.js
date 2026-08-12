'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Iconos SVG inline (sin dependencias extra) ─────────────────────────────

function IconPill() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function IconZap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}
function IconWifi() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  )
}
function IconBox() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLastSeen(isoString) {
  if (!isoString) return 'Sin datos'
  const d = new Date(isoString)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function statusBadge(status) {
  const map = {
    pending:   { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    fired:     { label: 'Disparada', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    cancelled: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  }
  return map[status] ?? { label: status, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HomePage() {
  const [medicamento, setMedicamento] = useState('')
  const [hexColor, setHexColor]       = useState('#06b6d4')
  const [alarmTime, setAlarmTime]     = useState('')
  const [cajon, setCajon]             = useState(1) // <-- NUEVO ESTADO DEL CAJÓN
  const [isSending, setIsSending]     = useState(false)
  const [isFiring, setIsFiring]       = useState(false)
  const [message, setMessage]         = useState('')
  const [messageType, setMessageType] = useState('')
  const [alarmas, setAlarmas]         = useState([])
  const [deletingId, setDeletingId]   = useState(null)
  const [deviceStatus, setDeviceStatus] = useState(null)

  // ── Cargar alarmas ──────────────────────────────────────────────────────────
  const cargarAlarmas = useCallback(async () => {
    try {
      const res = await fetch('/api/alarms')
      if (res.ok) setAlarmas(await res.json())
    } catch (e) {
      console.error('No se pudieron cargar las alarmas:', e)
    }
  }, [])

  useEffect(() => { cargarAlarmas() }, [cargarAlarmas])

  // ── Polling de estado del dispositivo (cada 5s) ─────────────────────────────
  const fetchDeviceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/device-status')
      if (res.ok) setDeviceStatus(await res.json())
    } catch (e) { /* silencioso */ }
  }, [])

  useEffect(() => {
    fetchDeviceStatus()
    const interval = setInterval(fetchDeviceStatus, 5000)
    return () => clearInterval(interval)
  }, [fetchDeviceStatus])

  // ── Programar alarma ────────────────────────────────────────────────────────
  async function handleSubmit(event) {
    event.preventDefault()
    if (!medicamento.trim()) { showMessage('error', 'Por favor ingresa el nombre del medicamento.'); return }
    if (!alarmTime)          { showMessage('error', 'Por favor selecciona la hora de la alarma.'); return }

    setIsSending(true)
    clearMessage()

    try {
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // AHORA SE ENVÍA EL CAJÓN A LA API
        body: JSON.stringify({ medicamento, color: hexColor, hora: alarmTime, cajon, dispararAhora: false }),
      })
      if (!res.ok) throw new Error('No se pudo guardar la alarma')
      const data = await res.json()
      setAlarmas((prev) => [data, ...prev])
      showMessage('success', `✅ Alarma programada para las ${alarmTime} en el Cajón ${cajon}.`)
      setMedicamento('')
      setAlarmTime('')
      setCajon(1)
    } catch (e) {
      showMessage('error', 'No se pudo programar la alarma. Intenta de nuevo.')
    } finally {
      setIsSending(false)
    }
  }

  // ── Disparar ahora ──────────────────────────────────────────────────────────
  async function handleDispararAhora() {
    if (!medicamento.trim()) { showMessage('error', 'Por favor ingresa el nombre del medicamento.'); return }
    setIsFiring(true)
    clearMessage()

    try {
      const hora = new Date().toTimeString().slice(0, 5)
      const res = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // AHORA SE ENVÍA EL CAJÓN AL DISPARAR DIRECTO
        body: JSON.stringify({ medicamento, color: hexColor, hora, cajon, dispararAhora: true }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAlarmas((prev) => [data, ...prev])
      showMessage('success', `⚡ Señal enviada al Cajón ${cajon} para "${medicamento}".`)
    } catch (e) {
      showMessage('error', 'No se pudo enviar la señal. Verifica las credenciales AWS.')
    } finally {
      setIsFiring(false)
    }
  }

  // ── Eliminar alarma ─────────────────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/alarms/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAlarmas((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      showMessage('error', 'No se pudo eliminar la alarma.')
    } finally {
      setDeletingId(null)
    }
  }

  function showMessage(type, text) { setMessageType(type); setMessage(text) }
  function clearMessage()          { setMessage(''); setMessageType('') }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const cajónAbierto = deviceStatus?.estado === 'abierto'
  const hayDispositivo = deviceStatus && deviceStatus.estado !== 'desconocido' && deviceStatus.estado !== 'error'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20">
                <IconPill />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">Panel IoT</p>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Organizador de Medicamentos
                </h1>
              </div>
            </div>
            {/* Badge estado dispositivo */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all
              ${hayDispositivo
                ? cajónAbierto
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-800/60 text-slate-400'}`}>
              <span className={`h-2 w-2 rounded-full ${hayDispositivo ? cajónAbierto ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400' : 'bg-slate-600'}`} />
              <IconWifi />
              {hayDispositivo
                ? cajónAbierto ? 'Cajón abierto — medicamento tomado' : 'Dispositivo en reposo'
                : 'Sin conexión con dispositivo'}
            </div>
          </div>
          {deviceStatus?.lastSeen && (
            <p className="mt-3 text-xs text-slate-500">
              Última actividad: {formatLastSeen(deviceStatus.lastSeen)}
            </p>
          )}
        </header>

        {/* ── Grid principal ──────────────────────────────────────────────── */}
        <section className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">

          {/* ── Panel izquierdo: Formulario ─────────────────────────────── */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg sm:p-8">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-400">Nueva alarma</p>
              <h2 className="mb-6 text-xl font-semibold text-white">Programar medicación</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre */}
                <div>
                  <label htmlFor="medicamento" className="mb-2 block text-sm font-medium text-slate-300">
                    Nombre del medicamento
                  </label>
                  <input
                    id="medicamento"
                    type="text"
                    value={medicamento}
                    onChange={(e) => setMedicamento(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Ej. Paracetamol"
                  />
                </div>

                {/* Color */}
                <div>
                  <label htmlFor="hexColor" className="mb-2 block text-sm font-medium text-slate-300">
                    Color de la alerta LED
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="hexColor"
                      type="color"
                      value={hexColor}
                      onChange={(e) => setHexColor(e.target.value)}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0.5"
                      aria-label="Seleccionar color de alerta"
                    />
                    <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-mono text-slate-300">
                      {hexColor.toUpperCase()}
                    </div>
                    <div
                      className="h-12 w-12 rounded-xl border border-slate-700 shadow-lg transition-all"
                      style={{ backgroundColor: hexColor, boxShadow: `0 0 20px ${hexColor}60` }}
                    />
                  </div>
                </div>

                {/* Hora */}
                <div>
                  <label htmlFor="alarmTime" className="mb-2 block text-sm font-medium text-slate-300">
                    Hora de la alarma
                  </label>
                  <input
                    id="alarmTime"
                    type="time"
                    value={alarmTime}
                    onChange={(e) => setAlarmTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>

                {/* NUEVO CAMPO: Selector de Cajón */}
                <div>
                  <label htmlFor="cajon" className="mb-2 block text-sm font-medium text-slate-300">
                    Compartimiento (Cajón)
                  </label>
                  <select
                    id="cajon"
                    value={cajon}
                    onChange={(e) => setCajon(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <option key={num} value={num}>Cajón {num}</option>
                    ))}
                  </select>
                </div>

                {/* Botones */}
                <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                  <button
                    type="submit"
                    disabled={isSending}
                    id="btn-programar"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <IconClock />
                    {isSending ? 'Guardando…' : 'Programar alarma'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDispararAhora}
                    disabled={isFiring}
                    id="btn-disparar-ahora"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <IconZap />
                    {isFiring ? 'Enviando…' : 'Disparar ahora'}
                  </button>
                </div>

                {message && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      messageType === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>

            {/* ── Preview del estado actual ──────────────────────────── */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Vista previa</p>
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-700 shadow-lg transition-all duration-300"
                  style={{ backgroundColor: hexColor + '22', borderColor: hexColor + '60', boxShadow: `0 0 24px ${hexColor}40` }}
                >
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: hexColor }} />
                </div>
                <div>
                  <p className="font-semibold text-white">{medicamento || 'Medicamento'} - Cajón {cajon}</p>
                  <p className="text-sm text-slate-400">{alarmTime ? `Programado para las ${alarmTime}` : 'Sin hora definida'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Panel derecho: Estado y lista de alarmas ─────────────────── */}
          <div className="space-y-6">

            {/* Estado del cajón */}
            <div className={`rounded-2xl border p-6 transition-all ${
              cajónAbierto
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-800 bg-slate-900/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cajónAbierto ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <IconBox />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Estado del cajón</p>
                  <p className={`text-lg font-semibold ${cajónAbierto ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {deviceStatus?.estado === 'abierto'  ? '✅ Abierto — medicamento tomado'
                     : deviceStatus?.estado === 'cerrado' ? '🔒 Cerrado — en reposo'
                     : '⏳ Esperando señal…'}
                  </p>
                </div>
              </div>
              {deviceStatus?.mensaje && (
                <p className="mt-3 text-xs text-slate-500">{deviceStatus.mensaje}</p>
              )}
            </div>

            {/* Lista de alarmas */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Alarmas guardadas</p>
                {alarmas.length > 0 && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {alarmas.length}
                  </span>
                )}
              </div>

              {alarmas.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center text-slate-600">
                  <IconClock />
                  <p className="mt-3 text-sm">Aún no hay alarmas guardadas.</p>
                  <p className="mt-1 text-xs">Programa tu primera medicación.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {alarmas.map((alarma) => {
                    const badge = statusBadge(alarma.status)
                    return (
                      <li
                        key={alarma.id}
                        className="group rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 transition-colors hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-lg border border-slate-700"
                              style={{ backgroundColor: alarma.color }}
                            />
                            <div>
                              <p className="font-semibold text-white">{alarma.medicamento}</p>
                              <p className="flex items-center gap-1 text-xs text-slate-400">
                                <IconClock /> {alarma.hora} • Cajón {alarma.cajon || 1}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                            <button
                              onClick={() => handleDelete(alarma.id)}
                              disabled={deletingId === alarma.id}
                              aria-label={`Eliminar alarma de ${alarma.medicamento}`}
                              className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100 disabled:cursor-not-allowed"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}