import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const [{ data: authData, error: authError }, { data: profiles, error: profError }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers(),
      supabaseAdmin.from('profiles').select('*')
    ])

    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    const users = (authData.users || []).map((u: any) => {
      const profile = profilesMap.get(u.id)
      const isBanned = Boolean(u.banned_until && new Date(u.banned_until) > new Date())
      return {
        id: u.id,
        email: u.email,
        full_name: profile?.full_name || u.user_metadata?.full_name || 'Sin Nombre',
        role: profile?.role || u.user_metadata?.role || 'vendedor',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        banned_until: u.banned_until,
        is_banned: isBanned,
        assigned_password: u.user_metadata?.assigned_password || null,
        user_metadata: u.user_metadata
      }
    })

    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, email, password, fullName, role, userId } = await request.json()

    if (action === 'create') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
      }

      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          full_name: fullName, 
          role: role || 'vendedor',
          assigned_password: password
        }
      })

      if (createError) throw createError

      if (authUser?.user) {
        await supabaseAdmin.from('profiles').upsert({
          id: authUser.user.id,
          full_name: fullName,
          role: role || 'vendedor'
        })
      }

      return NextResponse.json({ user: authUser.user })
    }

    if (action === 'update') {
      if (!userId) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })

      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(userId)

      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { 
            ...userRes?.user?.user_metadata,
            full_name: fullName, 
            role,
            ...(password ? { assigned_password: password } : {})
          },
          ...(password ? { password } : {})
        }
      )
      if (updateError) throw updateError

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        role: role
      })

      return NextResponse.json({ user: updatedUser.user })
    }

    if (action === 'toggle_block') {
      if (!userId) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })

      const { data: userRes, error: getError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (getError) throw getError

      const isCurrentlyBanned = Boolean(userRes.user?.banned_until && new Date(userRes.user.banned_until) > new Date())
      const newBanDuration = isCurrentlyBanned ? 'none' : '876600h'

      const { data: updated, error: banError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: newBanDuration
      })
      if (banError) throw banError

      const isNowBanned = !isCurrentlyBanned
      return NextResponse.json({
        success: true,
        is_banned: isNowBanned,
        message: isNowBanned ? 'Usuario bloqueado exitosamente' : 'Usuario desbloqueado exitosamente'
      })
    }

    if (action === 'change_password') {
      if (!userId || !password) {
        return NextResponse.json({ error: 'ID de usuario y contraseña son requeridos' }, { status: 400 })
      }
      const { data: userRes, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (getErr) throw getErr

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          ...userRes.user?.user_metadata,
          assigned_password: password
        }
      })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente' })
    }

    if (action === 'delete') {
      if (!userId) return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 })

      // 1. Reasignar pedidos y gastos creados por este usuario al Super Admin para evitar violación de Foreign Key en PostgreSQL
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers()
      const superAdmin = allUsers.find(u => u.email === 'superadmin@mcm.com')
      const targetReassignId = superAdmin?.id || null

      if (targetReassignId) {
        await supabaseAdmin.from('orders').update({ created_by: targetReassignId }).eq('created_by', userId)
        await supabaseAdmin.from('expenses').update({ created_by: targetReassignId }).eq('created_by', userId)
      }

      // 2. Eliminar de la tabla profiles
      await supabaseAdmin.from('profiles').delete().eq('id', userId)

      // 3. Eliminar de auth.users
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (delError) throw delError

      return NextResponse.json({ success: true, message: 'Usuario eliminado exitosamente' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
