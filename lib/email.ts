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
    cid?: string // 内嵌图片的 content-id
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

    const mailOptions = {
      from: fromEmail,
      to,
      subject,
      text,
      html: html || text,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        cid: att.cid,
      })),
    }

    console.log('发送邮件配置:', {
      to,
      subject,
      hasHtml: !!html,
      attachmentCount: attachments?.length || 0,
      attachments: attachments?.map(a => ({ filename: a.filename, cid: a.cid, size: a.content.length }))
    })

    const info = await transporter.sendMail(mailOptions)

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
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || '公司'

  // 替换变量
  const replaceVariables = (text: string) => {
    return text
      .replace(/{员工姓名}/g, employeeName || '员工')
      .replace(/{问卷标题}/g, questionnaireTitle)
      .replace(/{问卷链接}/g, surveyLink)
      .replace(/{公司名称}/g, companyName)
      .replace(/{日期}/g, currentDate)
  }

  // 默认邮件模板
  const DEFAULT_SUBJECT = '【离职回访】{问卷标题}'
  const DEFAULT_BODY = `尊敬的 {员工姓名}：

您好！感谢您在职期间的辛勤付出。

为了更好地了解您的离职原因和后续发展情况，我们诚挚邀请您填写以下问卷：

问卷标题：{问卷标题}
问卷链接：{问卷链接}

您也可以扫描下方二维码填写：

[二维码图片]

感谢您的配合！

{公司名称}
{日期}`

  // 使用传入的模板或默认模板，替换变量
  const subject = replaceVariables(customSubject || DEFAULT_SUBJECT)
  const textContent = replaceVariables(customBody || DEFAULT_BODY)

  // 生成 HTML：将纯文本转换为 HTML，处理二维码占位符
  let htmlContent = textContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>\n')

  // 处理二维码占位符
  if (qrCodeBuffer) {
    htmlContent = htmlContent.replace(
      /\[二维码图片\]/g,
      '<div style="text-align: center; margin: 20px 0;"><img src="cid:qrcode@survey" alt="问卷二维码" style="max-width: 200px; border-radius: 8px;" /></div>'
    )
  } else {
    htmlContent = htmlContent.replace(/\[二维码图片\]/g, '')
  }

  // 将问卷链接转换为可点击链接
  htmlContent = htmlContent.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color: #667eea;">$1</a>'
  )

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
${htmlContent}

<p style="color: #e74c3c; font-size: 14px; margin-top: 20px;">⏰ 此链接将在 ${expiresInDays} 天后过期，请尽快完成填写。</p>
<p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿直接回复。</p>
</body>
</html>`

  // 如果有二维码，使用带附件的发送方式
  if (qrCodeBuffer) {
    console.log('发送带二维码的邮件, 二维码大小:', qrCodeBuffer.length, 'bytes')
    return sendEmailWithAttachment({
      to,
      subject,
      text: textContent.replace('[二维码图片]', '[请查看邮件中的二维码图片]'),
      html,
      attachments: [{
        filename: '问卷二维码.png',
        content: qrCodeBuffer,
        contentType: 'image/png',
        cid: 'qrcode@survey',
      }],
      smtpPassword,
    })
  }

  console.log('发送无二维码的邮件')
  return sendEmail({
    to,
    subject,
    html,
    smtpPassword,
  })
}
