/**
 * 认证配置
 */

// 管理员账户配置
export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
}

// Session 配置
export const SESSION_CONFIG = {
  cookieName: 'session',
  maxAge: 24 * 60 * 60, // 24小时
}
