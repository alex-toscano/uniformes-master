/**
 * Utilidades de formateo para el sistema ERP Master
 */

/**
 * Formatea un número o cadena numérica agregando puntos de mil (formato Colombia es-CO).
 * Ejemplo: 50000 -> "50.000"
 */
export function formatThousands(value: string | number | null | undefined): string {
  if (value === '' || value === null || value === undefined) return ''
  const clean = value.toString().replace(/\D/g, '')
  if (!clean) return ''
  return parseInt(clean, 10).toLocaleString('es-CO')
}

/**
 * Convierte una cadena formateada con puntos de mil de vuelta a un número entero.
 * Ejemplo: "50.000" -> 50000
 */
export function parseThousands(value: string | number | null | undefined): number {
  if (value === '' || value === null || value === undefined) return 0
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value)
  const clean = value.replace(/\D/g, '')
  return clean ? parseInt(clean, 10) : 0
}

/**
 * Formato de moneda colombiana completo
 * Ejemplo: 50000 -> "$ 50.000"
 */
export function formatCOP(value: number | string | null | undefined): string {
  const num = typeof value === 'number' ? value : parseThousands(value)
  return `$${num.toLocaleString('es-CO')}`
}
