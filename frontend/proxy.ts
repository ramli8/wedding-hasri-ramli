import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that shouldn't be redirected even in demo mode
const PUBLIC_PATHS = [
    '/favicon.ico',
    '/_next',
    '/api',
    '/images' // Add any other static asset paths here if needed
]

export function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl
    const url = request.nextUrl.clone()

    // Check if DEMO mode is enabled via environment variable
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

    // If Demo Mode is NOT enabled, do nothing
    if (!isDemoMode) {
        return NextResponse.next()
    }

    // Skip redirecting public static files and API routes
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
        return NextResponse.next()
    }

    // If in demo mode but not already on a /demo path, redirect to /demo
    // Also skip redirecting the root index if you already have it pointed to /demo,
    // but the safest approach is to redirect everything that isn't /demo to /demo
    if (!pathname.startsWith('/demo')) {
        // Special case: if pathname is just "/", redirect to "/demo"
        if (pathname === '/') {
            url.pathname = '/demo'
        } else {
            // Otherwise, prepend /demo to the current path
            url.pathname = `/demo${pathname}`
        }

        // Add back query parameters if any
        if (search) {
            url.search = search
        }

        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}
