import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

const META_FILE_PATH = 'meta/designs.json'
const BUCKET_NAME = 'catalog'

async function getStoredDesigns(): Promise<any[]> {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(META_FILE_PATH)
    if (error || !data) return []
    const text = await data.text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveStoredDesigns(designs: any[]): Promise<boolean> {
  try {
    const supabase = getAdminClient()
    const jsonStr = JSON.stringify(designs, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(META_FILE_PATH, blob, {
      upsert: true,
      contentType: 'application/json'
    })
    return !error
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const all = url.searchParams.get('all') === 'true'

    const dynamicDesigns = await getStoredDesigns()

    if (all) {
      // Cargar también el catálogo estático base
      try {
        const localCatalogPath = path.join(process.cwd(), 'src', 'data', 'catalogData.json')
        if (fs.existsSync(localCatalogPath)) {
          const staticData = JSON.parse(fs.readFileSync(localCatalogPath, 'utf8'))
          // Los dinámicos primero para que tengan prioridad
          return NextResponse.json([...dynamicDesigns, ...staticData])
        }
      } catch (e) {
        console.error('Error reading static catalog:', e)
      }
    }

    return NextResponse.json(dynamicDesigns)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener diseños' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = (formData.get('name') as string || '').trim()
    const sku = (formData.get('sku') as string || '').trim().toUpperCase()
    const category = (formData.get('category') as string || 'eter').toLowerCase()
    const glow = (formData.get('glow') as string || 'rgba(255, 255, 255, 0.4)').trim()
    const description = (formData.get('description') as string || '').trim()

    if (!file) {
      return NextResponse.json({ error: 'La imagen es obligatoria.' }, { status: 400 })
    }
    if (!name || !sku) {
      return NextResponse.json({ error: 'El nombre y el SKU son obligatorios.' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. Subir la imagen a Supabase Storage
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const cleanFileName = sku.replace(/[^A-Z0-9_-]/gi, '_') + '_' + Date.now() + '.' + ext
    const storagePath = 'designs/' + cleanFileName

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, fileBuffer, {
      contentType: file.type || 'image/png',
      upsert: true
    })

    if (uploadError) {
      return NextResponse.json({ error: 'Error subiendo imagen: ' + uploadError.message }, { status: 500 })
    }

    const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
    const publicUrl = publicData?.publicUrl || storagePath

    // 2. Crear objeto del diseño
    const defaultDesc = description || ('Diseño ' + name + ' de la colección ' + category.toUpperCase() + '. Confeccionado con materiales de alto rendimiento deportivo.')

    const newDesign = {
      id: 'dyn-' + Date.now(),
      sku,
      name,
      category,
      glow,
      image: publicUrl,
      description: defaultDesc,
      created_at: new Date().toISOString()
    }

    // 3. Guardar en designs.json en Supabase Storage
    const currentDesigns = await getStoredDesigns()
    const updated = [newDesign, ...currentDesigns.filter(d => d.sku !== sku)]
    await saveStoredDesigns(updated)

    // 4. Si estamos en un entorno con acceso a disco, también guardar en local catalogData.json
    try {
      const localCatalogPath = path.join(process.cwd(), 'src', 'data', 'catalogData.json')
      if (fs.existsSync(localCatalogPath)) {
        const localData = JSON.parse(fs.readFileSync(localCatalogPath, 'utf8'))
        const localUpdated = [newDesign, ...localData.filter((d: any) => d.sku !== sku)]
        fs.writeFileSync(localCatalogPath, JSON.stringify(localUpdated, null, 2), 'utf8')
      }
    } catch {
      // Ignorar si el sistema de archivos es read-only (ej. serverless)
    }

    return NextResponse.json({ success: true, design: newDesign })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error guardando diseño' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sku, id } = await req.json()
    if (!sku && !id) {
      return NextResponse.json({ error: 'Se requiere sku o id para eliminar.' }, { status: 400 })
    }

    const currentDesigns = await getStoredDesigns()
    const toDelete = currentDesigns.find(d => (sku && d.sku === sku) || (id && d.id === id))
    const updated = currentDesigns.filter(d => (sku ? d.sku !== sku : true) && (id ? d.id !== id : true))

    await saveStoredDesigns(updated)

    // Si tiene imagen en Supabase, intentar eliminarla
    if (toDelete?.image && toDelete.image.includes('/designs/')) {
      try {
        const supabase = getAdminClient()
        const fileName = toDelete.image.split('/designs/').pop()
        if (fileName) {
          await supabase.storage.from(BUCKET_NAME).remove(['designs/' + fileName])
        }
      } catch {}
    }

    // Actualizar también local si es posible
    try {
      const localCatalogPath = path.join(process.cwd(), 'src', 'data', 'catalogData.json')
      if (fs.existsSync(localCatalogPath)) {
        const localData = JSON.parse(fs.readFileSync(localCatalogPath, 'utf8'))
        const localUpdated = localData.filter((d: any) => (sku ? d.sku !== sku : true) && (id ? d.id !== id : true))
        fs.writeFileSync(localCatalogPath, JSON.stringify(localUpdated, null, 2), 'utf8')
      }
    } catch {}

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error eliminando diseño' }, { status: 500 })
  }
}
