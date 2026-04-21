/**
 * 回访数据服务
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import type { FollowUpPlan, FollowUpRecord, FollowUpRecordFormData } from '@/types/follow-up'

type FollowUpPlanRow = Database['public']['Tables']['follow_up_plans']['Row']
type FollowUpPlanInsert = Database['public']['Tables']['follow_up_plans']['Insert']
type FollowUpPlanUpdate = Database['public']['Tables']['follow_up_plans']['Update']
type FollowUpRecordInsert = Database['public']['Tables']['follow_up_records']['Insert']

// 分页参数
interface PaginationParams {
  page?: number
  pageSize?: number
}

// 分页结果
interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 回访计划筛选参数
interface FollowUpFilters {
  status?: 'pending' | 'completed' | 'overdue'
  followUpType?: '1m' | '3m' | '6m' | 'custom'
  dateFrom?: string
  dateTo?: string
  employeeId?: string
}

/**
 * 获取回访计划列表（服务端）
 */
export async function getFollowUpPlans(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const supabase = await createSupabaseServerClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `,
      { count: 'exact' }
    )
    .order('plan_date', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.followUpType) {
    query = query.eq('follow_up_type', filters.followUpType)
  }
  if (filters.dateFrom) {
    query = query.gte('plan_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('plan_date', filters.dateTo)
  }
  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  // 转换数据格式
  const plans = (data || []).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
        }
      : undefined,
  })) as FollowUpPlan[]

  return {
    data: plans,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

/**
 * 根据ID获取回访计划（服务端）
 */
export async function getFollowUpPlanById(id: string): Promise<FollowUpPlan | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  return {
    ...data,
    employee: data.employees
      ? {
          name: data.employees.name,
          phone: data.employees.phone,
          department: data.employees.department,
        }
      : undefined,
  } as FollowUpPlan
}

/**
 * 创建回访计划（服务端）
 */
export async function createFollowUpPlan(
  planData: {
    employee_id: string
    plan_date: string
    follow_up_type: '1m' | '3m' | '6m' | 'custom'
  }
): Promise<FollowUpPlan> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('follow_up_plans')
    .insert({
      ...planData,
      status: 'pending',
      reminder_sent: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建回访计划失败: ${error.message}`)
  }

  return data as FollowUpPlan
}

/**
 * 创建回访记录（服务端）
 */
export async function createFollowUpRecord(
  planId: string,
  employeeId: string,
  recordData: FollowUpRecordFormData
): Promise<FollowUpRecord> {
  const supabase = await createSupabaseServerClient()

  // 创建回访记录
  const { data, error } = await supabase
    .from('follow_up_records')
    .insert({
      plan_id: planId,
      employee_id: employeeId,
      contact_method: recordData.contact_method,
      contact_result: recordData.contact_result,
      new_company: recordData.new_company || null,
      new_position: recordData.new_position || null,
      salary_change: recordData.salary_change || null,
      personal_feeling: recordData.personal_feeling || null,
      suggestions: recordData.suggestions || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`创建回访记录失败: ${error.message}`)
  }

  // 更新回访计划状态
  const { error: updateError } = await supabase
    .from('follow_up_plans')
    .update({ status: 'completed' })
    .eq('id', planId)

  if (updateError) {
    throw new Error(`更新回访计划状态失败: ${updateError.message}`)
  }

  // 更新员工状态
  const { error: employeeUpdateError } = await supabase
    .from('employees')
    .update({ status: 'followed', updated_at: new Date().toISOString() })
    .eq('id', employeeId)

  if (employeeUpdateError) {
    throw new Error(`更新员工状态失败: ${employeeUpdateError.message}`)
  }

  return data as unknown as FollowUpRecord
}

/**
 * 获取即将到期的回访计划（服务端）
 */
export async function getUpcomingFollowUps(
  days: number = 7
): Promise<FollowUpPlan[]> {
  const supabase = await createSupabaseServerClient()
  const today = new Date()
  const endDate = new Date()
  endDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `
    )
    .eq('status', 'pending')
    .gte('plan_date', today.toISOString().split('T')[0])
    .lte('plan_date', endDate.toISOString().split('T')[0])
    .order('plan_date', { ascending: true })

  if (error) {
    throw new Error(`获取即将到期的回访计划失败: ${error.message}`)
  }

  return (data || []).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
        }
      : undefined,
  })) as FollowUpPlan[]
}

/**
 * 获取回访统计数据（服务端）
 */
export async function getFollowUpStats(): Promise<{
  total: number
  pending: number
  completed: number
  overdue: number
  byType: Record<string, number>
  byContactMethod: Record<string, number>
}> {
  const supabase = await createSupabaseServerClient()

  // 获取计划统计
  const { data: plans, error: plansError } = await supabase
    .from('follow_up_plans')
    .select('status, follow_up_type')

  if (plansError) {
    throw new Error(`获取回访计划统计失败: ${plansError.message}`)
  }

  // 获取记录统计
  const { data: records, error: recordsError } = await supabase
    .from('follow_up_records')
    .select('contact_method')

  if (recordsError) {
    throw new Error(`获取回访记录统计失败: ${recordsError.message}`)
  }

  const today = new Date().toISOString().split('T')[0]
  const stats = {
    total: plans?.length || 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    byType: {} as Record<string, number>,
    byContactMethod: {} as Record<string, number>,
  }

  // 统计计划状态
  plans?.forEach((plan) => {
    if (plan.status === 'pending') {
      // 检查是否逾期
      const planDate = plan.plan_date
      if (planDate && planDate < today) {
        stats.overdue++
      } else {
        stats.pending++
      }
    } else if (plan.status === 'completed') {
      stats.completed++
    }

    // 按类型统计
    if (plan.follow_up_type) {
      stats.byType[plan.follow_up_type] = (stats.byType[plan.follow_up_type] || 0) + 1
    }
  })

  // 统计联系方式
  records?.forEach((record) => {
    if (record.contact_method) {
      stats.byContactMethod[record.contact_method] =
        (stats.byContactMethod[record.contact_method] || 0) + 1
    }
  })

  return stats
}

/**
 * 为员工创建默认回访计划（服务端）
 */
export async function createDefaultFollowUpPlans(
  employeeId: string,
  leaveDate: string
): Promise<FollowUpPlan[]> {
  const plans: FollowUpPlan[] = []
  const leaveDateObj = new Date(leaveDate)

  // 定义默认回访时间点
  const followUpConfigs = [
    { type: '1m' as const, months: 1 },
    { type: '3m' as const, months: 3 },
    { type: '6m' as const, months: 6 },
  ]

  for (const config of followUpConfigs) {
    const planDate = new Date(leaveDateObj)
    planDate.setMonth(planDate.getMonth() + config.months)

    const plan = await createFollowUpPlan({
      employee_id: employeeId,
      plan_date: planDate.toISOString().split('T')[0],
      follow_up_type: config.type,
    })

    plans.push(plan)
  }

  return plans
}

/**
 * 获取员工的回访记录（服务端）
 */
export async function getFollowUpRecordsByEmployee(
  employeeId: string
): Promise<FollowUpRecord[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('follow_up_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`获取员工回访记录失败: ${error.message}`)
  }

  return (data || []) as unknown as FollowUpRecord[]
}

/**
 * 客户端获取回访计划列表
 */
export async function getFollowUpPlansClient(
  filters: FollowUpFilters = {},
  pagination: PaginationParams = {}
): Promise<PaginatedResult<FollowUpPlan>> {
  const supabase = createSupabaseBrowserClient()
  const { page = 1, pageSize = 10 } = pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('follow_up_plans')
    .select(
      `
      *,
      employees (
        name,
        phone,
        department
      )
    `,
      { count: 'exact' }
    )
    .order('plan_date', { ascending: true })

  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.followUpType) {
    query = query.eq('follow_up_type', filters.followUpType)
  }
  if (filters.dateFrom) {
    query = query.gte('plan_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('plan_date', filters.dateTo)
  }
  if (filters.employeeId) {
    query = query.eq('employee_id', filters.employeeId)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(`获取回访计划失败: ${error.message}`)
  }

  const plans = (data || []).map((item) => ({
    ...item,
    employee: item.employees
      ? {
          name: item.employees.name,
          phone: item.employees.phone,
          department: item.employees.department,
        }
      : undefined,
  })) as FollowUpPlan[]

  return {
    data: plans,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}
