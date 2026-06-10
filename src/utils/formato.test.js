import { describe, it, expect } from 'vitest'
import { estadoLabel, formatMoneda, estadoClass, metodoPagoLabel } from './formato'

describe('estadoLabel', () => {
  it('regresa la etiqueta correcta para pendiente', () => {
    expect(estadoLabel('pendiente')).toBe('Pendiente')
  })

  it('regresa la etiqueta correcta para en_proceso', () => {
    expect(estadoLabel('en_proceso')).toBe('En proceso')
  })

  it('regresa la etiqueta para en_camino', () => {
    expect(estadoLabel('en_camino')).toBe('En camino')
  })

  it('entregado debe mostrar Entregado', () => {
    expect(estadoLabel('entregado')).toBe('Entregado')
  })

  it('cancelado debe mostrar Cancelado', () => {
    expect(estadoLabel('cancelado')).toBe('Cancelado')
  })

  it('si el estado no esta en el mapa regresa el mismo valor', () => {
    expect(estadoLabel('devolucion')).toBe('devolucion')
  })

  it('null debe regresar el guion', () => {
    expect(estadoLabel(null)).toBe('—')
  })

  it('undefined tambien regresa el guion', () => {
    expect(estadoLabel(undefined)).toBe('—')
  })
})

describe('formatMoneda', () => {
  it('formatea correctamente un precio normal', () => {
    expect(formatMoneda(1500)).toBe('$1,500.00')
  })

  it('formatea el cero sin errores', () => {
    expect(formatMoneda(0)).toBe('$0.00')
  })

  it('null regresa el guion', () => {
    expect(formatMoneda(null)).toBe('—')
  })
})

describe('estadoClass', () => {
  it('pendiente da clase pendiente', () => {
    expect(estadoClass('pendiente')).toBe('pendiente')
  })

  it('en_proceso da clase proceso', () => {
    expect(estadoClass('en_proceso')).toBe('proceso')
  })

  it('en_camino da clase camino', () => {
    expect(estadoClass('en_camino')).toBe('camino')
  })

  it('entregado da clase completado', () => {
    expect(estadoClass('entregado')).toBe('completado')
  })

  it('cancelado da clase cancelado', () => {
    expect(estadoClass('cancelado')).toBe('cancelado')
  })

  it('estado desconocido regresa string vacio', () => {
    expect(estadoClass('otro')).toBe('')
  })
})

describe('metodoPagoLabel', () => {
  it('OXXO muestra OXXO Pay', () => {
    expect(metodoPagoLabel('OXXO')).toBe('OXXO Pay')
  })

  it('Tarjeta se mantiene igual', () => {
    expect(metodoPagoLabel('Tarjeta')).toBe('Tarjeta')
  })

  it('null regresa el guion', () => {
    expect(metodoPagoLabel(null)).toBe('—')
  })
})
