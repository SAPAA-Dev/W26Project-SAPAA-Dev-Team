import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // getUser() may rotate the auth cookies onto supabaseResponse. A new response must carry
  // them too, or the browser keeps the old refresh token and the session ends.
  const withAuthCookies = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  // Allow access to login, signup, and auth pages without authentication
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/error')
  ) {
    // Redirect unauthenticated users to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return withAuthCookies(NextResponse.redirect(url))
  }

  // Approval (#5) is checked on the server too, not only in ProtectedRoute. A signed-in
  // user that an admin has not approved may only load /sites, where ProtectedRoute shows
  // the "Awaiting Admin Approval" screen. Other pages redirect there; anything else
  // (API calls, server action POSTs) gets 403.
  const path = request.nextUrl.pathname
  if (
    user &&
    user.app_metadata?.authenticated !== true &&
    !['/login', '/signup', '/auth', '/error'].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
  ) {
    if (request.method === 'GET' && path === '/sites') {
      return supabaseResponse
    }
    if (request.method === 'GET' && !path.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/sites'
      url.search = ''
      return withAuthCookies(NextResponse.redirect(url))
    }
    return withAuthCookies(NextResponse.json({ error: 'Your account is awaiting admin approval.' }, { status: 403 }))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}