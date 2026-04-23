/**
 * 认证模块
 * 使用 HMAC-SHA256 签名 token（Web Crypto API，兼容 Edge Runtime）
 */
import { cookies } from 'next/headers'
import { ADMIN_CREDENTIALS, SESSION_CONFIG } from './config'

// 导出配置供 middleware 使用
export { SESSION_CONFIG } from './config'

// 签名密钥
const SECRET_KEY = process.env.SESSION_SECRET || 'hr-realtime-tracking-secret-key'

/**
 * 使用 Web Crypto API 签名
 */
async function hmacSign(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 生成 session token
 */
export async function generateSessionToken(): Promise<string> {
  const payload = `${Date.now()}`
  const signature = await hmacSign(payload)
  return `${payload}.${signature}`
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
  const token = await generateSessionToken()

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
  return verifySessionTokenAsync(session?.value)
}

/**
 * 异步验证 session token
 */
async function verifySessionTokenAsync(token: string | undefined): Promise<boolean> {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payload, signature] = parts
  const timestamp = parseInt(payload, 10)

  // 检查是否过期
  if (Date.now() - timestamp > SESSION_CONFIG.maxAge * 1000) {
    return false
  }

  const expected = await hmacSign(payload)
  return signature === expected
}

/**
 * 验证 session (用于 middleware)
 * Web Crypto API 在 Edge Runtime 中可用，middleware 本身是 async
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  return verifySessionTokenAsync(token)
}

/**
 * 清除 session
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_CONFIG.cookieName)
}
