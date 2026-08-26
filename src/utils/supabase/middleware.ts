import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Esto actualizará la sesión si ha expirado
  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard')

  // Redirigir al login si no hay usuario e intenta acceder al dashboard
  if (!user && isDashboardPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario logueado e intenta ir al login o raíz del dashboard, redirigir según su rol
  if (user && (isLoginPage || request.nextUrl.pathname === '/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'vendedor'
    const url = request.nextUrl.clone()
    
    if (role === 'super_admin') url.pathname = '/dashboard/super-admin'
    else if (role === 'admin') url.pathname = '/dashboard/admin'
    else url.pathname = '/dashboard/vendedor'
    
    return NextResponse.redirect(url)
  }

  // Protección cruzada (RBAC): Un rol menor no puede entrar al dashboard de un rol mayor
  if (user && isDashboardPage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    const role = profile?.role || 'vendedor'
    
    if (request.nextUrl.pathname.startsWith('/dashboard/super-admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone(); url.pathname = '/dashboard/admin'; return NextResponse.redirect(url)
    }
    if (request.nextUrl.pathname.startsWith('/dashboard/admin') && role !== 'admin' && role !== 'super_admin') {
      const url = request.nextUrl.clone(); url.pathname = '/dashboard/vendedor'; return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
