/**
 * SQLite 数据库类型定义
 * 用于本地数据存储
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// 员工表
export interface EmployeeRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  department: string | null
  team: string | null
  position: string | null
  leave_date: string | null
  leave_reason: string | null
  employment_duration: number | null
  reporter_id: string | null
  status: 'pending' | 'followed'
  created_at: string
  updated_at: string
}

export interface EmployeeInsert {
  id?: string
  name: string
  phone?: string | null
  email?: string | null
  department?: string | null
  team?: string | null
  position?: string | null
  leave_date?: string | null
  leave_reason?: string | null
  employment_duration?: number | null
  reporter_id?: string | null
  status?: 'pending' | 'followed'
  created_at?: string
  updated_at?: string
}

export interface EmployeeUpdate {
  id?: string
  name?: string
  phone?: string | null
  email?: string | null
  department?: string | null
  team?: string | null
  position?: string | null
  leave_date?: string | null
  leave_reason?: string | null
  employment_duration?: number | null
  reporter_id?: string | null
  status?: 'pending' | 'followed'
  created_at?: string
  updated_at?: string
}

// 问卷表
export interface QuestionnaireRow {
  id: string
  title: string
  description: string | null
  questions: string // JSON string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  external_url: string | null
  external_type: string | null
  email_subject: string | null
  email_body: string | null
}

export interface QuestionnaireInsert {
  id?: string
  title: string
  description?: string | null
  questions?: string
  status?: 'draft' | 'active' | 'archived'
  created_at?: string
  external_url?: string | null
  external_type?: string | null
  email_subject?: string | null
  email_body?: string | null
}

export interface QuestionnaireUpdate {
  id?: string
  title?: string
  description?: string | null
  questions?: string
  status?: 'draft' | 'active' | 'archived'
  created_at?: string
  external_url?: string | null
  external_type?: string | null
  email_subject?: string | null
  email_body?: string | null
}

// 问卷令牌表
export interface SurveyTokenRow {
  id: string
  token: string
  employee_id: string | null
  questionnaire_id: string | null
  used: number // 0 or 1 in SQLite
  expires_at: string | null
  created_at: string
}

export interface SurveyTokenInsert {
  id?: string
  token: string
  employee_id?: string | null
  questionnaire_id?: string | null
  used?: number
  expires_at?: string | null
  created_at?: string
}

export interface SurveyTokenUpdate {
  id?: string
  token?: string
  employee_id?: string | null
  questionnaire_id?: string | null
  used?: number
  expires_at?: string | null
  created_at?: string
}

// 问卷回答表
export interface SurveyResponseRow {
  id: string
  employee_id: string | null
  questionnaire_id: string | null
  answers: string // JSON string
  submit_channel: 'survey' | 'manual'
  submitted_at: string
}

export interface SurveyResponseInsert {
  id?: string
  employee_id?: string | null
  questionnaire_id?: string | null
  answers?: string
  submit_channel?: 'survey' | 'manual'
  submitted_at?: string
}

export interface SurveyResponseUpdate {
  id?: string
  employee_id?: string | null
  questionnaire_id?: string | null
  answers?: string
  submit_channel?: 'survey' | 'manual'
  submitted_at?: string
}

// 回访计划表
export interface FollowUpPlanRow {
  id: string
  employee_id: string | null
  plan_date: string | null
  follow_up_type: '1m' | '3m' | '6m' | 'custom'
  status: 'pending' | 'completed' | 'overdue'
  reminder_sent: number // 0 or 1 in SQLite
  created_at: string
}

export interface FollowUpPlanInsert {
  id?: string
  employee_id?: string | null
  plan_date?: string | null
  follow_up_type?: '1m' | '3m' | '6m' | 'custom'
  status?: 'pending' | 'completed' | 'overdue'
  reminder_sent?: number
  created_at?: string
}

export interface FollowUpPlanUpdate {
  id?: string
  employee_id?: string | null
  plan_date?: string | null
  follow_up_type?: '1m' | '3m' | '6m' | 'custom'
  status?: 'pending' | 'completed' | 'overdue'
  reminder_sent?: number
  created_at?: string
}

// 回访记录表
export interface FollowUpRecordRow {
  id: string
  plan_id: string | null
  employee_id: string | null
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string | null
  new_position: string | null
  salary_change: 'increase' | 'decrease' | 'same' | null
  personal_feeling: string | null
  suggestions: string | null
  created_at: string
}

export interface FollowUpRecordInsert {
  id?: string
  plan_id?: string | null
  employee_id?: string | null
  contact_method?: 'phone' | 'wechat' | 'email'
  contact_result?: 'connected' | 'no_answer' | 'refused'
  new_company?: string | null
  new_position?: string | null
  salary_change?: 'increase' | 'decrease' | 'same' | null
  personal_feeling?: string | null
  suggestions?: string | null
  created_at?: string
}

export interface FollowUpRecordUpdate {
  id?: string
  plan_id?: string | null
  employee_id?: string | null
  contact_method?: 'phone' | 'wechat' | 'email'
  contact_result?: 'connected' | 'no_answer' | 'refused'
  new_company?: string | null
  new_position?: string | null
  salary_change?: 'increase' | 'decrease' | 'same' | null
  personal_feeling?: string | null
  suggestions?: string | null
  created_at?: string
}

// 报告表
export interface ReportRow {
  id: string
  title: string
  type: string
  filters: string | null // JSON string
  content: string | null // JSON string
  created_at: string
}

export interface ReportInsert {
  id?: string
  title: string
  type: string
  filters?: string | null
  content?: string | null
  created_at?: string
}

export interface ReportUpdate {
  id?: string
  title?: string
  type?: string
  filters?: string | null
  content?: string | null
  created_at?: string
}
