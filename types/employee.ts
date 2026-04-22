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
  team?: string // 班组
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
  '网信安全部',
  '供应链管理部',
  '质量管理部',
  '计划部',
  '数智化部',
  '运行维护部',
  '科技创新部',
  '未来科技研究院',
  '计算产品部',
  '存储产品部',
  '平台产品部',
  '数据库产品部',
  '应用产品部',
  '云网产品部',
  '市场部',
  '客户服务部',
  '集成交付部',
  '其他',
] as const

export const POSITIONS = [
  '研发',
  '产品经理',
  '测试',
  '运维',
  '其他',
] as const

export type LeaveReason = (typeof LEAVE_REASONS)[number]
export type Department = (typeof DEPARTMENTS)[number]
export type Position = (typeof POSITIONS)[number]
