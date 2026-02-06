import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // 1. Check for session cookie
    const session = request.cookies.get('jukut_session')
    const { pathname } = request.nextUrl

    // 2. Define public paths that don't need auth (Login, Static assets are handled by config matcher)
    // But we double check here just in case logic complexity grows
    if (pathname === '/login') {
        // Optional: Redirect to dashboard if already logged in
        if (session) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // 3. Protect all other routes
    if (!session) {
        const loginUrl = new URL('/login', request.url)
        // Optional: Add ?from=... to redirect back after login
        // loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

// 4. Config Matcher to exclude static files and API routes (unless API needs protection too)
// User asked to NOT protect static files, etc.
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - hospital-login-bg.png (public asset)
         * - login (login page itself)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|hospital-login-bg.png|login).*)',
    ],
}
