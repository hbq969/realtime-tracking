/**
 * 问卷类型定义
 */

export type QuestionType = 'single' | 'multiple' | 'text' | 'rating'

export interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: string[]
  placeholder?: string
}

export interface Questionnaire {
  id: string
  title: string
  description: string
  questions: Question[]
  status: 'draft' | 'active' | 'archived'
  created_at: string
}

export interface QuestionnaireFormData {
  title: string
  description: string
  questions: Question[]
}

export interface SurveyToken {
  id: string
  token: string
  employee_id: string
  questionnaire_id: string
  used: boolean
  expires_at: string
  created_at: string
}

export interface SurveyResponse {
  id: string
  employee_id: string
  questionnaire_id: string
  answers: Record<string, string | string[]>
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}
