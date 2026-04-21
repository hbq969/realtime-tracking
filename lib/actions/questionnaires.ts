'use server'

/**
 * 问卷相关的服务端操作
 */
import { revalidatePath } from 'next/cache'
import {
  createQuestionnaire as createQuestionnaireDB,
  updateQuestionnaire as updateQuestionnaireDB,
  generateSurveyToken as generateSurveyTokenDB,
  getSurveyResponseRate as getSurveyResponseRateDB,
  submitSurveyResponse as submitResponse,
  validateSurveyToken as validateToken,
} from '@/lib/db/questionnaires'
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
