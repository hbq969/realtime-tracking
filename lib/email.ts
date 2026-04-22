/**
 * 邮件发送服务 (SMTP)
 */
import nodemailer from 'nodemailer'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  smtpPassword: string // 授权码由前端传入
}

// 创建邮件传输器
function createTransporter(userEmail: string, password: string) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.cmss.chinamobile.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // 465 端口使用 SSL
    auth: {
      user: userEmail,
      pass: password,
    },
  })
}

/**
 * 获取当前登录用户邮箱
 */
async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.email || null
  } catch {
    return null
  }
}

/**
 * 发送邮件
 */
export async function sendEmail({
  to,
  subject,
  html,
  smtpPassword,
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  // 获取当前登录用户邮箱作为发件人
  const fromEmail = await getCurrentUserEmail()

  if (!fromEmail) {
    return {
      success: false,
      error: '无法获取当前登录用户信息，请重新登录',
    }
  }

  if (!smtpPassword) {
    return {
      success: false,
      error: '请输入邮箱授权码',
    }
  }

  try {
    const transporter = createTransporter(fromEmail, smtpPassword)

    const info = await transporter.sendMail({
      from: fromEmail,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
    })

    console.log('邮件发送成功:', info.messageId)
    return { success: true }
  } catch (err) {
    console.error('邮件发送失败:', err)
    return { success: false, error: (err as Error).message }
  }
}

/**
 * 发送问卷邀请邮件
 */
export async function sendQuestionnaireInvitation(params: {
  to: string
  employeeName: string
  questionnaireTitle: string
  surveyLink: string
  expiresInDays: number
  smtpPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, employeeName, questionnaireTitle, surveyLink, expiresInDays, smtpPassword } = params

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #667eea; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">📋 问卷邀请</h1>
        </div>
        <div class="content">
          <p>尊敬的 <strong>${employeeName}</strong> 您好，</p>
          <p>我们诚挚地邀请您参与以下问卷调研：</p>

          <div class="info-box">
            <h3 style="margin: 0 0 10px 0;">${questionnaireTitle}</h3>
            <p style="margin: 0; color: #666;">您的反馈对我们非常重要，感谢您的参与！</p>
          </div>

          <p>请点击下方按钮开始填写问卷：</p>

          <div style="text-align: center;">
            <a href="${surveyLink}" class="button">开始填写问卷</a>
          </div>

          <p style="color: #888; font-size: 14px;">
            🔗 如果按钮无法点击，请复制以下链接到浏览器打开：<br>
            <a href="${surveyLink}" style="word-break: break-all; color: #667eea;">${surveyLink}</a>
          </p>

          <p style="color: #e74c3c; font-size: 14px;">
            ⏰ 此链接将在 ${expiresInDays} 天后过期，请尽快完成填写。
          </p>
        </div>
        <div class="footer">
          <p>此邮件由系统自动发送，请勿直接回复。</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to,
    subject: `问卷邀请: ${questionnaireTitle}`,
    html,
    smtpPassword,
  })
}
