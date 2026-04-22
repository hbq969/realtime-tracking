/**
 * 认证模块
 */
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { ADMIN_CREDENTIALS, SESSION_CONFIG } from './config'

// 导出配置供 middleware 使用
export { SESSION_CONFIG } from './config'

// 存储有效的 session tokens (简单实现，生产环境建议使用 Redis 等)
const validSessions = new Set<string>()

/**
 * 生成 session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 验证登录凭据
 */
export function verifyCredentials(username: string, password: string): boolean {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  )
}

/**
 * 创建 session
 */
export async function createSession(): Promise<string> {
  const token = generateSessionToken()
  validSessions.add(token)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_CONFIG.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_CONFIG.maxAge,
    path: '/',
  })

  return token
}

/**
 * 验证 session (用于 Server Actions 和 Server Components)
 */
export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_CONFIG.cookieName)

  if (!session?.value) {
    return false
  }

  return validSessions.has(session.value)
}

/**
 * 验证 session (用于 middleware)
 * @param sessionToken - 从 request cookies 中获取的 session token
 */
export function verifySessionToken(sessionToken: string | undefined): boolean {
  if (!sessionToken) {
    return false
  }
  return validSessions.has(sessionToken)
}

/**
 * 清除 session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_CONFIG.cookieName)

  if (session?.value) {
    validSessions.delete(session.value)
  }

  cookieStore.delete(SESSION_CONFIG.cookieName)
}
