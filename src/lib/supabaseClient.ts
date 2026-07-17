const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Cliente Supabase ligero usando fetch nativo para evitar problemas de npm
export const supabase = {
  from: (table: string) => ({
    insert: async (data: any[]) => {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(data[0]) // Supabase insert acepta un objeto o array, enviamos el primer elemento
        });

        if (!response.ok) {
          const errText = await response.text();
          return { error: new Error(`Error ${response.status}: ${errText}`) };
        }
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    }
  })
};
