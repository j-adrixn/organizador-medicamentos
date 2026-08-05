const test = require('node:test')
const assert = require('node:assert/strict')

const { createAlarmRecord } = require('../alarms')

test('createAlarmRecord devuelve un registro con id y timestamp', () => {
  const record = createAlarmRecord('Paracetamol', '#00FF00', '08:30')

  assert.equal(record.medicamento, 'Paracetamol')
  assert.equal(record.color, '#00FF00')
  assert.equal(record.hora, '08:30')
  assert.ok(record.id)
  assert.ok(record.createdAt)
})

test('createAlarmRecord rechaza datos vacíos', () => {
  assert.throws(() => createAlarmRecord('', '#00FF00', '08:30'), /medicamento/i)
})
