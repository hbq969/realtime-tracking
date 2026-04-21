/**
 * 回访类型定义
 */

export interface FollowUpPlan {
  id: string
  employee_id: string
  plan_date: string
  follow_up_type: '1m' | '3m' | '6m' | 'custom'
  status: 'pending' | 'completed' | 'overdue'
  reminder_sent: boolean
  created_at: string
  employee?: {
    name: string
    phone: string
    department: string
  }
}

export interface FollowUpRecord {
  id: string
  plan_id: string
  employee_id: string
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string
  new_position: string
  salary_change: 'increase' | 'decrease' | 'same'
  personal_feeling: string
  suggestions: string
  created_at: string
}

export interface FollowUpRecordFormData {
  contact_method: 'phone' | 'wechat' | 'email'
  contact_result: 'connected' | 'no_answer' | 'refused'
  new_company: string
  new_position: string
  salary_change: 'increase' | 'decrease' | 'same'
  personal_feeling: string
  suggestions: string
}

export const FOLLOW_UP_TYPES = [
  { value: '1m', label: '离职后1个月' },
  { value: '3m', label: '离职后3个月' },
  { value: '6m', label: '离职后6个月' },
  { value: 'custom', label: '自定义' },
] as const

export const CONTACT_METHODS = [
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'email', label: '邮件' },
] as const

export const CONTACT_RESULTS = [
  { value: 'connected', label: '已联系' },
  { value: 'no_answer', label: '未接通' },
  { value: 'refused', label: '拒绝回答' },
] as const

export const SALARY_CHANGES = [
  { value: 'increase', label: '涨薪' },
  { value: 'decrease', label: '降薪' },
  { value: 'same', label: '持平' },
] as const

export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]['value']
export type ContactMethod = (typeof CONTACT_METHODS)[number]['value']
export type ContactResult = (typeof CONTACT_RESULTS)[number]['value']
export type SalaryChange = (typeof SALARY_CHANGES)[number]['value']
