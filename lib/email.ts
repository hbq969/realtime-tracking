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
 * 发送带附件的邮件
 */
export async function sendEmailWithAttachment(params: {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
  smtpPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, text, html, attachments, smtpPassword } = params

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
      to,
      subject,
      text,
      html: html || text,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
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
  customSubject?: string
  customBody?: string
  qrCodeBuffer?: Buffer
}): Promise<{ success: boolean; error?: string }> {
  const { to, employeeName, questionnaireTitle, surveyLink, expiresInDays, smtpPassword, customSubject, customBody, qrCodeBuffer } = params

  // 获取当前日期
  const now = new Date()
  const currentDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  // 替换变量
  const replaceVariables = (text: string) => {
    return text
      .replace(/{员工姓名}/g, employeeName || '员工')
      .replace(/{问卷标题}/g, questionnaireTitle)
      .replace(/{问卷链接}/g, surveyLink)
      .replace(/{公司名称}/g, '公司')
      .replace(/{日期}/g, currentDate)
  }

  const subject = customSubject ? replaceVariables(customSubject) : `问卷邀请: ${questionnaireTitle}`
  const textContent = customBody ? replaceVariables(customBody) : `尊敬的 ${employeeName}：

您好！感谢您在职期间的辛勤付出。

为了更好地了解您的离职原因和后续发展情况，我们诚挚邀请您填写以下问卷：

问卷标题：${questionnaireTitle}
问卷链接：${surveyLink}

感谢您的配合！
${currentDate}`

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
        .qr-code { text-align: center; margin: 20px 0; }
        .qr-code img { max-width: 200px; border-radius: 8px; }
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

          ${qrCodeBuffer ? `
          <div class="qr-code">
            <p style="color: #666; margin-bottom: 10px;">或扫描二维码填写：</p>
            <img src="cid:qrcode@survey" alt="问卷二维码" />
          </div>
          ` : ''}

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

  // 如果有二维码，使用带附件的发送方式
  if (qrCodeBuffer) {
    return sendEmailWithAttachment({
      to,
      subject,
      text: textContent,
      html,
      attachments: [{
        filename: '问卷二维码.png',
        content: qrCodeBuffer,
        contentType: 'image/png',
      }],
      smtpPassword,
    })
  }

  return sendEmail({
    to,
    subject,
    html,
    smtpPassword,
  })
}
