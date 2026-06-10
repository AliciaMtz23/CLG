import { describe, it, expect } from 'vitest'

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.id === action.item.id)
      if (existing) {
        return state.map(i =>
          i.id === action.item.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, i.stock) }
            : i
        )
      }
      return [...state, { ...action.item, cantidad: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i.id !== action.id)
    case 'UPDATE_QTY':
      return state.map(i =>
        i.id === action.id
          ? { ...i, cantidad: Math.max(1, Math.min(action.cantidad, i.stock)) }
          : i
      )
    case 'LOAD':
      return Array.isArray(action.items) ? action.items : []
    case 'CLEAR':
      return []
    default:
      return state
  }
}

describe('ADD', () => {
  it('agrega un producto nuevo cuando el carrito esta vacio', () => {
    const result = cartReducer([], {
      type: 'ADD',
      item: { id: 3, nombre: 'Arnes Basic', precio: 850, stock: 5 }
    })
    expect(result).toHaveLength(1)
    expect(result[0].cantidad).toBe(1)
  })

  it('si el producto ya esta en el carrito aumenta la cantidad', () => {
    const state = [{ id: 3, nombre: 'Arnes Basic', precio: 850, stock: 5, cantidad: 1 }]
    const result = cartReducer(state, { type: 'ADD', item: { id: 3, stock: 5 } })
    expect(result[0].cantidad).toBe(2)
  })

  it('la cantidad no puede superar el stock disponible', () => {
    const state = [{ id: 3, nombre: 'Arnes Basic', precio: 850, stock: 3, cantidad: 3 }]
    const result = cartReducer(state, { type: 'ADD', item: { id: 3, stock: 3 } })
    expect(result[0].cantidad).toBe(3)
  })
})

describe('REMOVE', () => {
  it('elimina el producto del carrito', () => {
    const state = [
      { id: 3, cantidad: 1 },
      { id: 7, cantidad: 2 }
    ]
    const result = cartReducer(state, { type: 'REMOVE', id: 3 })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(7)
  })

  it('si el id no existe no cambia nada', () => {
    const state = [{ id: 3, cantidad: 1 }]
    const result = cartReducer(state, { type: 'REMOVE', id: 99 })
    expect(result).toHaveLength(1)
  })
})

describe('UPDATE_QTY', () => {
  it('actualiza la cantidad correctamente', () => {
    const state = [{ id: 3, stock: 10, cantidad: 1 }]
    const result = cartReducer(state, { type: 'UPDATE_QTY', id: 3, cantidad: 4 })
    expect(result[0].cantidad).toBe(4)
  })

  it('la cantidad minima permitida es 1', () => {
    const state = [{ id: 3, stock: 10, cantidad: 2 }]
    const result = cartReducer(state, { type: 'UPDATE_QTY', id: 3, cantidad: 0 })
    expect(result[0].cantidad).toBe(1)
  })

  it('no permite poner mas del stock', () => {
    const state = [{ id: 3, stock: 5, cantidad: 3 }]
    const result = cartReducer(state, { type: 'UPDATE_QTY', id: 3, cantidad: 10 })
    expect(result[0].cantidad).toBe(5)
  })
})

describe('LOAD', () => {
  it('carga los items cuando recibe un array', () => {
    const items = [{ id: 3 }, { id: 7 }]
    const result = cartReducer([], { type: 'LOAD', items })
    expect(result).toEqual(items)
  })

  it('si no es un array regresa vacio', () => {
    const result = cartReducer([{ id: 3 }], { type: 'LOAD', items: 'invalido' })
    expect(result).toEqual([])
  })
})

describe('CLEAR', () => {
  it('vacia todo el carrito', () => {
    const state = [{ id: 3 }, { id: 7 }]
    const result = cartReducer(state, { type: 'CLEAR' })
    expect(result).toEqual([])
  })
})

describe('default', () => {
  it('accion desconocida no modifica el estado', () => {
    const state = [{ id: 3, cantidad: 1 }]
    const result = cartReducer(state, { type: 'OTRA_COSA' })
    expect(result).toEqual(state)
  })
})
