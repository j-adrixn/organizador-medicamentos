function createAlarmRecord(medicamento, color, hora) {
  if (!medicamento || !medicamento.trim()) {
    throw new Error('El medicamento es obligatorio.')
  }

  if (!color) {
    throw new Error('El color es obligatorio.')
  }

  if (!hora) {
    throw new Error('La hora es obligatoria.')
  }

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    medicamento: medicamento.trim(),
    color,
    hora,
    createdAt: new Date().toISOString(),
  }
}

module.exports = {
  createAlarmRecord,
}
