import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for NextAuth session token in cookies
  // NextAuth.js v5 uses different cookie names depending on environment
  const sessionToken = 
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value

  // Protect dashboard route - requires authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Protect course routes - requires authentication
  if (request.nextUrl.pathname.startsWith('/courses/')) {
    if (!sessionToken) {
      // Redirect to login if not authenticated
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Additional tier checking is done in server components
    // This middleware just ensures user is authenticated
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

