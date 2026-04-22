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
} from '@/lib/db/questionnaires'
import { getEmployeeById } from '@/lib/db/employees'
import { sendQuestionnaireInvitation } from '@/lib/email'
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
  smtpPassword: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
      const surveyLink = `${appUrl}/survey/${token}`

      // 发送邮件
      const emailResult = await sendQuestionnaireInvitation({
        to: employee.email,
        employeeName: employee.name,
        questionnaireTitle,
        surveyLink,
        expiresInDays,
        smtpPassword,
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
