/**
 * 离职员工类型定义
 */

import type { Employee as DbEmployee } from '@/types/database'

// 使用数据库类型作为基础
export type Employee = DbEmployee

export interface EmployeeFormData {
  name: string
  phone: string
  email: string
  department: string
  position: string
  leave_date: string
  leave_reason: string
  employment_duration: number
}

export const LEAVE_REASONS = [
  '个人发展',
  '薪资待遇',
  '工作环境',
  '家庭原因',
  '健康原因',
  '继续深造',
  '创业',
  '其他',
] as const

export const DEPARTMENTS = [
  '技术部',
  '产品部',
  '运营部',
  '市场部',
  '人力资源部',
  '财务部',
  '行政部',
  '其他',
] as const

export type LeaveReason = (typeof LEAVE_REASONS)[number]
export type Department = (typeof DEPARTMENTS)[number]
