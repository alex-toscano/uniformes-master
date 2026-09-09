import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data.users })
}

export async function POST(request: Request) {
  try {
    const { action, email, password, fullName, role, userId } = await request.json()
    if (action === 'create') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name: fullName, role: role || 'vendedor' }
      })
      if (error) throw error
      return NextResponse.json({ user: data.user })
    } 
    if (action === 'update') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId, { user_metadata: { full_name: fullName, role: role }, ...(password ? { password } : {}) }
      )
      if (error) throw error
      return NextResponse.json({ user: data.user })
    }
    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
