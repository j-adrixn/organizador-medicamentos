'use client'

import { useEffect, useState } from 'react'
import { createAlarmRecord } from '@/lib/alarms'

export default function HomePage() {
  const [medicamento, setMedicamento] = useState('')
  const [hexColor, setHexColor] = useState('#FF0000')
  const [alarmTime, setAlarmTime] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [alarmas, setAlarmas] = useState([])

  useEffect(() => {
    async function cargarAlarmas() {
      try {
        const response = await fetch('/api/alarms')
        if (!response.ok) {
          throw new Error('No se pudieron cargar las alarmas')
        }
        const data = await response.json()
        setAlarmas(data)
      } catch (error) {
        console.error('No se pudieron recuperar las alarmas guardadas:', error)
      }
    }

    cargarAlarmas()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!medicamento.trim()) {
      setMessageType('error')
      setMessage('Por favor ingresa el nombre del medicamento.')
      return
    }

    if (!alarmTime) {
      setMessageType('error')
      setMessage('Por favor selecciona la hora de la alarma.')
      return
    }

    setIsSending(true)
    setMessage('')
    setMessageType('')

    try {
      const scheduledAlarm = createAlarmRecord(medicamento, hexColor, alarmTime)
      const response = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicamento: scheduledAlarm.medicamento,
          color: scheduledAlarm.color,
          hora: scheduledAlarm.hora,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar la alarma')
      }

      const data = await response.json()
      const nuevasAlarmas = [data, ...alarmas]
      setAlarmas(nuevasAlarmas)

      console.log('Alarma programada:', data)

      setMessageType('success')
      setMessage('Alarma programada correctamente. Se guardó en la API del proyecto.')
      setMedicamento('')
      setHexColor('#FF0000')
      setAlarmTime('')
    } catch (error) {
      console.error('Error al programar la alarma:', error)
      setMessageType('error')
      setMessage('No se pudo programar la alarma. Intenta de nuevo.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-12">
        <header className="mb-10 rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/30 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400/80">Panel IoT</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Organizador de Medicamentos
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Envía alertas visuales a tu dispositivo IoT con un color distintivo y nombre de medicamento.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-950/70 px-6 py-5 text-sm ring-1 ring-slate-800 sm:px-8">
              <p className="font-medium text-slate-200">Modo</p>
              <p className="mt-1 text-cyan-300">Programación de alarmas</p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/20">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Programar nueva medicación</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Configuración rápida</h2>
              <p className="mt-2 text-slate-400">
                Completa el formulario y programa una alarma para tu medicación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="medicamento" className="block text-sm font-medium text-slate-200">
                  Nombre del medicamento
                </label>
                <input
                  id="medicamento"
                  type="text"
                  value={medicamento}
                  onChange={(event) => setMedicamento(event.target.value)}
                  required
                  className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Ej. Paracetamol"
                />
              </div>

              <div>
                <label htmlFor="hexColor" className="block text-sm font-medium text-slate-200">
                  Color de la alerta visual
                </label>
                <div className="mt-3 flex items-center gap-4">
                  <input
                    id="hexColor"
                    type="color"
                    value={hexColor}
                    onChange={(event) => setHexColor(event.target.value)}
                    className="h-14 w-14 cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-0"
                    aria-label="Seleccionar color de alerta"
                  />
                  <span className="rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200">
                    {hexColor.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="alarmTime" className="block text-sm font-medium text-slate-200">
                  Hora de la alarma
                </label>
                <input
                  id="alarmTime"
                  type="time"
                  value={alarmTime}
                  onChange={(event) => setAlarmTime(event.target.value)}
                  required
                  className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex w-full justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-600/70"
              >
                {isSending ? 'Enviando...' : 'Programar Alarma'}
              </button>

              {message ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={
                    'rounded-3xl border px-5 py-4 text-sm ' +
                    (messageType === 'success'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-rose-400/30 bg-rose-500/10 text-rose-200')
                  }
                >
                  {message}
                </div>
              ) : null}
            </form>
          </div>

          <aside className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-xl shadow-slate-950/20">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Estado de la alerta</p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-white">{medicamento || 'Ninguno seleccionado'}</p>
                  <p className="mt-2 text-sm text-slate-400">Nombre del medicamento que se notificará.</p>
                </div>
                <div
                  className="h-16 w-16 rounded-2xl border border-slate-700"
                  style={{ backgroundColor: hexColor }}
                  aria-label={`Color de alerta actual ${hexColor}`}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Alarmas guardadas</p>
              {alarmas.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Aún no hay alarmas guardadas.</p>
              ) : (
                <ul className="mt-4 space-y-3 text-slate-300">
                  {alarmas.map((alarma) => (
                    <li key={alarma.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{alarma.medicamento}</p>
                          <p className="text-sm text-slate-400">{alarma.hora}</p>
                        </div>
                        <div
                          className="h-8 w-8 rounded-full border border-slate-700"
                          style={{ backgroundColor: alarma.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
