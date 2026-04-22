'use server'

/**
 * 问卷相关的服务端操作
 */
import { revalidatePath } from 'next/cache'
import {
  createQuestionnaire as createQuestionnaireDB,
  updateQuestionnaire as updateQuestionnaireDB,
  deleteQuestionnaire as deleteQuestionnaireDB,
  generateSurveyToken as generateSurveyTokenDB,
  getSurveyResponseRate as getSurveyResponseRateDB,
  submitSurveyResponse as submitResponse,
  validateSurveyToken as validateToken,
  getQuestionnaireById,
} from '@/lib/db/questionnaires'
import { getEmployeeById } from '@/lib/db/employees'
import { sendQuestionnaireInvitation } from '@/lib/email'
import { generateQRCodeBuffer } from '@/lib/qrcode'
import type { Question } from '@/types/questionnaire'

export async function createQuestionnaire(data: {
  title: string
  description?: string
  questions: Question[]
  status?: 'draft' | 'active' | 'archived'
}) {
  const result = await createQuestionnaireDB(data)
  revalidatePath('/questionnaires')
  return result
}

export async function updateQuestionnaire(
  id: string,
  data: Partial<{
    title: string
    description: string
    questions: Question[]
    status: 'draft' | 'active' | 'archived'
  }>
) {
  const result = await updateQuestionnaireDB(id, data)
  revalidatePath('/questionnaires')
  revalidatePath(`/questionnaires/${id}`)
  return result
}

export async function deleteQuestionnaire(id: string): Promise<void> {
  await deleteQuestionnaireDB(id)
  revalidatePath('/questionnaires')
}

export async function generateSurveyToken(
  employeeId: string,
  questionnaireId: string,
  expiresInDays: number = 30
): Promise<string> {
  return generateSurveyTokenDB(employeeId, questionnaireId, expiresInDays)
}

export async function getSurveyResponseRate(questionnaireId?: string): Promise<{
  totalSent: number
  totalResponded: number
  responseRate: number
}> {
  return getSurveyResponseRateDB(questionnaireId)
}

export async function submitSurveyAnswer(
  token: string,
  answers: Record<string, string | string[]>
): Promise<{ success: boolean; error?: string }> {
  try {
    await submitResponse(token, answers)
    return { success: true }
  } catch (error) {
    console.error('提交问卷失败:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function validateSurveyToken(token: string): Promise<{
  valid: boolean
  employeeId?: string
  questionnaireId?: string
  error?: string
}> {
  return validateToken(token)
}

/**
 * 发送问卷邮件给员工
 */
export async function sendQuestionnaireEmail(
  employeeIds: string[],
  questionnaireId: string,
  questionnaireTitle: string,
  expiresInDays: number = 30,
  smtpPassword: string,
  customEmailSubject?: string,
  customEmailBody?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // 获取问卷信息，生成二维码
  const questionnaire = await getQuestionnaireById(questionnaireId)
  let qrCodeBuffer: Buffer | null = null
  if (questionnaire?.external_url) {
    try {
      qrCodeBuffer = await generateQRCodeBuffer(questionnaire.external_url)
      console.log('二维码生成成功, 大小:', qrCodeBuffer.length, 'bytes')
    } catch (error) {
      console.error('生成二维码失败:', error)
    }
  } else {
    console.log('问卷没有外部链接，不生成二维码')
  }

  // 使用传入的模板，如果没有则使用问卷保存的模板
  const emailSubject = customEmailSubject || questionnaire?.email_subject || undefined
  const emailBody = customEmailBody || questionnaire?.email_body || undefined

  for (const employeeId of employeeIds) {
    try {
      // 获取员工信息
      const employee = await getEmployeeById(employeeId)
      if (!employee) {
        results.failed++
        results.errors.push(`员工 ${employeeId}: 员工不存在`)
        continue
      }

      if (!employee.email) {
        results.failed++
        results.errors.push(`员工 ${employee.name}: 没有邮箱地址`)
        continue
      }

      // 生成问卷令牌
      const token = await generateSurveyTokenDB(employeeId, questionnaireId, expiresInDays)
      const surveyLink = questionnaire?.external_url || `${appUrl}/survey/${token}`

      // 发送邮件
      const emailResult = await sendQuestionnaireInvitation({
        to: employee.email,
        employeeName: employee.name,
        questionnaireTitle,
        surveyLink,
        expiresInDays,
        smtpPassword,
        customSubject: emailSubject,
        customBody: emailBody,
        qrCodeBuffer: qrCodeBuffer || undefined,
      })

      if (emailResult.success) {
        results.success++
      } else {
        results.failed++
        results.errors.push(`员工 ${employee.name}(${employee.email}): ${emailResult.error}`)
      }
    } catch (error) {
      results.failed++
      results.errors.push(`员工 ${employeeId}: ${(error as Error).message}`)
    }
  }

  revalidatePath('/questionnaires')
  return results
}
