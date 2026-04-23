import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken, SESSION_CONFIG } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // 从 request cookies 获取 session token
  const sessionToken = request.cookies.get(SESSION_CONFIG.cookieName)?.value
  const isLoggedIn = await verifySessionToken(sessionToken)

  // 公开路径
  const publicPaths = ['/login', '/survey', '/api/auth']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (!isLoggedIn && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isLoggedIn && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
