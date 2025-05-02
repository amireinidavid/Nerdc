import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
  '/journals',
  '/articles',
  '/authors',
  '/blog',
  '/contact',
]

// Check if the path is a public path or starts with a public path
const isPublicPath = (path: string): boolean => {
  return publicPaths.some(publicPath => 
    path === publicPath || 
    path.startsWith(`${publicPath}/`) ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.includes('.') // Static files like images, CSS, etc.
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  
  // If no tokens, redirect to login
  if (!accessToken && !refreshToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', encodeURI(pathname))
    return NextResponse.redirect(url)
  }

  try {
    // If there's no access token but refresh token exists, 
    // the page will render but the client-side code should handle refreshing the token
    if (!accessToken && refreshToken) {
      // Let the request continue - our AuthProvider will try to refresh the token
      return NextResponse.next()
    }

    // If we have an access token, continue to the requested page
    return NextResponse.next()
  } catch (error) {
    // If something goes wrong, redirect to login
    console.error('Middleware authentication error:', error)
    const url = new URL('/login', request.url)
    url.searchParams.set('from', encodeURI(pathname))
    return NextResponse.redirect(url)
  }
}

// Apply middleware to specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (app images)
     * - public/ (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|public/).*)',
  ],
}
