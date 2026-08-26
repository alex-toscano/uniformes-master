import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  host: 'db.dealeibdftajydqyyhqs.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'hack316-brian',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  try {
    await client.connect();
    console.log("Conectado a la base de datos de Supabase.");
    
    // Crear tabla leads
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.leads (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        nombre text NOT NULL,
        escuela text NOT NULL,
        cantidad_estimada text NOT NULL,
        sku_interes text NOT NULL,
        fecha timestamp with time zone DEFAULT now()
      );
    `;
    await client.query(createTableQuery);
    console.log("✅ Tabla 'leads' creada o ya existía.");

    // Habilitar acceso anónimo para inserción (desactivar RLS o crear política)
    // Desactivaremos RLS en esta tabla para simplificar
    await client.query(`ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;`);
    console.log("✅ RLS desactivado para 'leads' para permitir inserciones públicas.");

  } catch (error) {
    console.error("Error configurando la base de datos:", error);
  } finally {
    await client.end();
  }
}

setup();
