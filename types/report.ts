/**
 * 报告类型定义
 */

export interface Report {
  id: string
  title: string
  type: string
  filters: Record<string, unknown>
  content: Record<string, unknown>
  created_at: string
}

export interface ReportFilters {
  date_from?: string
  date_to?: string
  departments?: string[]
  leave_reasons?: string[]
}

export interface ReportContent {
  summary: {
    total_employees: number
    follow_up_rate: number
    survey_response_rate: number
  }
  leave_reasons: Record<string, number>
  salary_changes: Record<string, number>
  new_companies: Array<{ name: string; count: number }>
  suggestions: string[]
}

export const REPORT_TYPES = [
  { value: 'summary', label: '综合报告' },
  { value: 'leave_analysis', label: '离职原因分析' },
  { value: 'follow_up', label: '回访情况报告' },
  { value: 'retention', label: '员工保有建议' },
] as const

export type ReportType = (typeof REPORT_TYPES)[number]['value']
