import { SupabaseClient } from '@supabase/supabase-js'

export interface BaseProduct {
  name: string
  prices: {
    Infantil: number
    Juvenil: number
    Adulto: number
  }
}

export const DEFAULT_CATEGORIES = ['Infantil', 'Juvenil', 'Adulto'] as const
export type SizeCategory = typeof DEFAULT_CATEGORIES[number]

export const INITIAL_DEFAULT_PRODUCTS: BaseProduct[] = [
  {
    name: 'Uniforme',
    prices: { Infantil: 40000, Juvenil: 43000, Adulto: 45000 }
  },
  {
    name: 'Chaqueta',
    prices: { Infantil: 65000, Juvenil: 65000, Adulto: 65000 }
  },
  {
    name: 'Pantaloneta Licrada',
    prices: { Infantil: 20000, Juvenil: 20000, Adulto: 20000 }
  },
  {
    name: 'Pantaloneta Impermeable',
    prices: { Infantil: 20000, Juvenil: 20000, Adulto: 20000 }
  },
  {
    name: 'Medias',
    prices: { Infantil: 12000, Juvenil: 12000, Adulto: 12000 }
  }
]

/**
 * Obtiene la lista de productos base y sus precios desde Supabase (customer_pricing donde customer_id es NULL).
 * Si la base de datos está vacía, inicializa los productos predeterminados.
 */
export async function fetchBaseProducts(supabase: SupabaseClient): Promise<BaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from('customer_pricing')
      .select('*')
      .is('customer_id', null)

    if (error || !data || data.length === 0) {
      // Intentar sembrar los iniciales en segundo plano
      seedInitialProducts(supabase).catch(() => {})
      return INITIAL_DEFAULT_PRODUCTS
    }

    // Agrupar filas por product_type
    const map = new Map<string, { Infantil: number; Juvenil: number; Adulto: number }>()

    data.forEach((row: any) => {
      const prodName = row.product_type
      if (!map.has(prodName)) {
        map.set(prodName, { Infantil: 0, Juvenil: 0, Adulto: 0 })
      }
      const cat = row.size_category as SizeCategory
      if (cat === 'Infantil' || cat === 'Juvenil' || cat === 'Adulto') {
        map.get(prodName)![cat] = row.price || 0
      } else if (cat === 'General') {
        map.get(prodName)!.Infantil = row.price || 0
        map.get(prodName)!.Juvenil = row.price || 0
        map.get(prodName)!.Adulto = row.price || 0
      }
    })

    const result: BaseProduct[] = []
    map.forEach((prices, name) => {
      result.push({ name, prices })
    })

    // Asegurar que si hay productos iniciales que no están guardados, se conserven
    if (result.length === 0) return INITIAL_DEFAULT_PRODUCTS
    return result
  } catch {
    return INITIAL_DEFAULT_PRODUCTS
  }
}

/**
 * Guarda o inserta los productos iniciales en la base de datos
 */
async function seedInitialProducts(supabase: SupabaseClient) {
  const rowsToInsert: any[] = []
  INITIAL_DEFAULT_PRODUCTS.forEach(p => {
    DEFAULT_CATEGORIES.forEach(cat => {
      rowsToInsert.push({
        customer_id: null,
        product_type: p.name,
        size_category: cat,
        price: p.prices[cat]
      })
    })
  })
  await supabase.from('customer_pricing').insert(rowsToInsert)
}

/**
 * Guarda o actualiza un producto base con sus precios por categoría
 */
export async function saveBaseProduct(
  supabase: SupabaseClient,
  productName: string,
  prices: { Infantil: number; Juvenil: number; Adulto: number }
) {
  const cleanName = productName.trim()
  if (!cleanName) throw new Error('El nombre del producto no puede estar vacío.')

  // Borrar precios existentes de este producto base
  await supabase
    .from('customer_pricing')
    .delete()
    .is('customer_id', null)
    .eq('product_type', cleanName)

  const rows = DEFAULT_CATEGORIES.map(cat => ({
    customer_id: null,
    product_type: cleanName,
    size_category: cat,
    price: prices[cat] || 0
  }))

  const { error } = await supabase.from('customer_pricing').insert(rows)
  if (error) throw error

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catalog-updated'))
  }
}

/**
 * Modifica el nombre y/o precios de un producto base
 */
export async function updateBaseProduct(
  supabase: SupabaseClient,
  oldName: string,
  newName: string,
  prices: { Infantil: number; Juvenil: number; Adulto: number }
) {
  const cleanNewName = newName.trim()
  if (!cleanNewName) throw new Error('El nombre del producto no puede estar vacío.')

  // Borrar el registro anterior
  await supabase
    .from('customer_pricing')
    .delete()
    .is('customer_id', null)
    .eq('product_type', oldName)

  const rows = DEFAULT_CATEGORIES.map(cat => ({
    customer_id: null,
    product_type: cleanNewName,
    size_category: cat,
    price: prices[cat] || 0
  }))

  const { error } = await supabase.from('customer_pricing').insert(rows)
  if (error) throw error

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catalog-updated'))
  }
}

/**
 * Elimina un producto base del catálogo
 */
export async function deleteBaseProduct(supabase: SupabaseClient, productName: string) {
  const { error } = await supabase
    .from('customer_pricing')
    .delete()
    .is('customer_id', null)
    .eq('product_type', productName)

  if (error) throw error

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('catalog-updated'))
  }
}

/**
 * Obtiene el precio base de un producto según la categoría de talla
 */
export function getBasePrice(
  baseProducts: BaseProduct[],
  productType: string,
  sizeCategory: string
): number {
  const normalizedType = productType.trim()
  const prod = baseProducts.find(p => p.name.toLowerCase() === normalizedType.toLowerCase())
  if (!prod) return 35000

  const cat = sizeCategory as SizeCategory
  if (prod.prices[cat] !== undefined && prod.prices[cat] > 0) {
    return prod.prices[cat]
  }

  return prod.prices.Adulto || 35000
}

/**
 * Helper para extraer nombre de jugador y observaciones de una sola cadena
 * Ejemplo: "JUAN [OBS: Manga larga]" -> { name: "JUAN", observations: "Manga larga" }
 * Ejemplo: "[OBS: Licrada]" -> { name: "", observations: "Licrada" }
 */
export function extractPlayerNameAndObs(rawName: string | null | undefined): { name: string; observations: string } {
  if (!rawName) return { name: '', observations: '' }
  const match = rawName.match(/\[OBS:\s*(.*?)\]/)
  if (match) {
    const observations = match[1].trim()
    const name = rawName.replace(/\[OBS:\s*.*?\]/, '').trim()
    return { name, observations }
  }
  return { name: rawName.trim(), observations: '' }
}

/**
 * Helper para combinar nombre de jugador y observaciones antes de guardar en la base de datos
 */
export function formatPlayerItem(name: string, observations?: string): string {
  const cleanName = (name || '').trim()
  const cleanObs = (observations || '').trim()
  if (cleanObs) {
    return cleanName ? `${cleanName} [OBS: ${cleanObs}]` : `[OBS: ${cleanObs}]`
  }
  return cleanName
}
